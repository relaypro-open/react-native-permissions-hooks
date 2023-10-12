import { useCallback, useMemo } from 'react'
import { Platform } from 'react-native'

import noop from 'lodash/noop'

import { PERMISSIONS } from 'react-native-permissions'

import { usePermission } from '../base'
import { useIOSLocationAccuracy } from './useIOSLocationAccuracy'

import { _permissionLogger } from '../utils/logger'
import { isBlocked, isGranted } from '../utils'



const iosCanUseAccuracy = (precise) => (precise && parseInt(Platform.Version, 10) >= 14)
const hasPreciseAccuracy = (accuracy) => accuracy === `full`


export const useLocationPermissions = (options={precise: false, background: false, allowWhenInUse: false, handleMissingAccuracy: noop, handleBackgroundBlocked: noop}, handlePrompt=noop, handleBlocked=noop) => {
    const { precise, background, allowWhenInUse, purposeKey, handleMissingAccuracy, handleBackgroundBlocked } = options

    const [whenInUseResult, checkWhenInUse, requestWhenInUse] = usePermission(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
    const [alwaysResult, checkAlways, requestAlways] = usePermission(PERMISSIONS.IOS.LOCATION_ALWAYS)
    const [iosAccuracy, checkAccuracy, requestAccuracy] = useIOSLocationAccuracy(purposeKey)


    const check = useCallback(async () => {
        try {
            _permissionLogger(`useLocationPermissions#check`)

            let returnMap = {}
            returnMap[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] = await checkWhenInUse()

            if (background) {
                returnMap[PERMISSIONS.IOS.LOCATION_ALWAYS] = await checkAlways()
            }

            if (iosCanUseAccuracy(precise)) {
                await checkAccuracy()
            }

            return returnMap
        } catch (err) {
            _permissionLogger(`useLocationPermissions#check => Got error checking location permissions: `, err)
        }
    }, [checkWhenInUse, background, checkAlways, precise, checkAccuracy])


    const request = useCallback(async () => {
        try {
            _permissionLogger(`useLocationPermissions#request`)

            let returnMap = {}
            let _whenInUseResult = whenInUseResult
            let _alwaysResult = alwaysResult
            if (background && !isGranted(alwaysResult)) {
                _permissionLogger(`useLocationPermissions#request => attempting to request location_always`)
                await handlePrompt()
                _alwaysResult = await requestAlways()
                returnMap[PERMISSIONS.IOS.LOCATION_ALWAYS] = _alwaysResult
                _whenInUseResult = await checkWhenInUse()
            }
            else if (!isGranted(_whenInUseResult)){
                _permissionLogger(`useLocationPermissions#request => attempting to request location_when_in_use`)
                await handlePrompt()
                _whenInUseResult = await requestWhenInUse()
                returnMap[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] = _whenInUseResult
            }

            if (isGranted(_whenInUseResult) && iosCanUseAccuracy(precise) && !hasPreciseAccuracy(iosAccuracy)) {
                _permissionLogger(`useLocationPermissions#request => requesting full accuracy`)
                let accuracy = await requestAccuracy()
                if (!hasPreciseAccuracy(accuracy)) {
                    await handleMissingAccuracy()
                }
            }

            if (isBlocked(_whenInUseResult)) {
                await handleBlocked()
            }

            else if (isBlocked(_alwaysResult)) {
                await handleBackgroundBlocked()
            }

            return returnMap
        } catch (err) {
            _permissionLogger(`useLocationPermissions#request => Got error requesting location permissions: `, err)
        }
    }, [
        background, precise,
        alwaysResult, whenInUseResult, requestAlways, requestWhenInUse, checkWhenInUse,
        iosAccuracy, requestAccuracy,
        handlePrompt, handleBlocked, handleMissingAccuracy, handleBackgroundBlocked
    ])


    const granted = useMemo(() => {
        const hasWhenInUse = isGranted(whenInUseResult)
        const hasAlways = isGranted(alwaysResult)

        // Don't account for accuracy here. The precise option will try to request it but won't block permission status
        // Use the useHasFullLocationAccuracy hook for more control
        return hasWhenInUse &&
            (background ? (hasAlways || allowWhenInUse) : true)
    }, [whenInUseResult, alwaysResult, background, allowWhenInUse])

    const blocked = useMemo(() => {
        const whenInUseBlocked = isBlocked(whenInUseResult)
        const alwaysBlocked = isBlocked(alwaysResult)

        return whenInUseBlocked ||
            ((background && allowWhenInUse === false) ? alwaysBlocked : false)
    }, [whenInUseResult, alwaysResult, background, allowWhenInUse])


    const fetchGranted = useCallback(async () => {
        const result = await check()
        return isGranted(result)
    }, [check])


    return [granted, blocked, fetchGranted, request]

}
