import { useCallback, useMemo } from 'react'
import { Platform } from 'react-native'

import noop from 'lodash/noop'

import { PERMISSIONS } from 'react-native-permissions'

import { containsBlocked, isBlocked, isGranted, isGrantedMultiple, reduceMultipleResults } from '../utils'
import { _permissionLogger } from '../utils/logger'
import { useMultiplePermissions, usePermission } from '../base'


const androidCanUseBackground = (background) => (background && Platform.Version >= 29)


export const useLocationPermissions = (options={precise: false, background: false, allowWhenInUse: false, handleBackgroundPrompt: noop, handleBackgroundBlocked: noop}, handlePrompt=noop, handleBlocked=noop) => {

    const { precise, background, allowWhenInUse, handleBackgroundPrompt, handleBackgroundBlocked } = options

    const permissions = useMemo(() => (
        precise ?
            [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] :
            [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]
    ), [precise])

    const [permissionsResult, checkPermissions, requestPermissions] = useMultiplePermissions(permissions)
    // TODO: make sure using this (which will check on mount) doesn't crash on android < 29
    const [backgroundResult, checkBackground, requestBackground] = usePermission(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION)



    const check = useCallback(async () => {
        try {
            _permissionLogger(`useLocationPermissions#check`)
            let result = await checkPermissions()
            if (background && androidCanUseBackground(background)) {
                let backgroundResult = await checkBackground()
                result[PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION] = backgroundResult

                return result
            }
            else {
                return result
            }
        } catch (err) {
            _permissionLogger(`useLocationPermissions#check => Got error checking location permissions: `, err)
        }
    }, [checkPermissions, background, checkBackground])



    const request = useCallback(async () => {
        try {
            _permissionLogger(`useLocationPermissions#request`)
            let result = permissionsResult
            if (!isGranted(permissionsResult)) {
                await handlePrompt()
                // save off result
                let requestResult = await requestPermissions()
                result = reduceMultipleResults(requestResult)

                if (isBlocked(result)) {
                    await handleBlocked()
                }
            }

            // Request background permissions if we have base permissions and background has been requested
            if (isGranted(result) && androidCanUseBackground(background)) {
                _permissionLogger(`useLocationPermissions#request => prompting for background permissions`)
                // Handle caller's prompt (if provided), if we catch an error, skip requesting
                let rejected = false
                try {
                    await handleBackgroundPrompt()
                } catch (err) {
                    rejected = true
                }

                if (!rejected) {
                    _permissionLogger(`useLocationPermissions#request => requesting background permissions`)
                    let backgroundResult = await requestBackground()
                    result[PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION] = backgroundResult

                    if (isBlocked(backgroundResult)) {
                        handleBackgroundBlocked()
                    }
                }
            }

            return result
        } catch (err) {
            _permissionLogger(`useLocationPermissions#request => Got error requesting location permissions: `, err)
        }
    }, [
        permissionsResult, requestPermissions,
        background, requestBackground,
        handleBackgroundPrompt, handleBackgroundBlocked,
        handleBlocked, handlePrompt
    ])



    const granted = useMemo(() => {
        let permissionsGranted = isGrantedMultiple(permissionsResult)
        if (androidCanUseBackground(background) && allowWhenInUse === false) {
            return permissionsGranted && isGranted(backgroundResult)
        }
        else {
            return permissionsGranted
        }
    }, [permissionsResult, background, backgroundResult, allowWhenInUse])

    const blocked = useMemo(() => {
        let permissionsBlocked = containsBlocked(permissionsResult)
        if (androidCanUseBackground(background) && allowWhenInUse === false) {
            return permissionsBlocked || isBlocked(backgroundResult)
        }
        else {
            return permissionsBlocked
        }
    }, [permissionsResult, background, backgroundResult, allowWhenInUse])


    const fetchGranted = useCallback(async () => {
        const result = await check()
        return isGranted(reduceMultipleResults(result))
    }, [check])


    return [granted, blocked, fetchGranted, request]
}
