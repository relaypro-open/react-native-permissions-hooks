import { useCallback, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { PERMISSIONS, RESULTS, check, checkMultiple, request, requestMultiple, checkLocationAccuracy, requestLocationAccuracy } from 'react-native-permissions'

import isEmpty from 'lodash/isEmpty'
import noop from 'lodash/noop'

import { isGranted, isBlocked, openSettingsButtons, containsUnavailable, containsBlocked, containsDenied, containsLimited } from './utils'
import { _permissionLogger } from './logger'
import useMount from './hooks/useMount'
import useAppResume from './hooks/useAppResume'
import { alertAsPromised, customAlertAsPromised, simpleAlertAsPromised } from './alerts'


const androidBackgroundPermission = PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION


const iosCanUseAccuracy = (precise) => (precise && Platform.OS === `ios` && parseInt(Platform.Version, 10) >= 14)
const hasPreciseAccuracy = (accuracy) => accuracy === `full`
const androidCanUseBackground = (background) => (background && Platform.OS === `android` && Platform.Version >= 29)
//const androidCanUsePrecise = (precise) => (precise && Platform.OS === `android` && Platform.Version >= 31)
const reduceResult = (result, precise, background, iosAccuracy, androidBackgroundResult) => {
    // _permissionLogger(`useLocationPermissions#reduceResult => result: ${result}, precise: ${precise}, background: ${background}, iosAccuracy: ${iosAccuracy}, androidBackgroundResult: ${androidBackgroundResult}`)
    let granted = isGranted(result)
    // _permissionLogger(`useLocationPermissions#reduceResult => iosCanUseAccuracy: ${iosCanUseAccuracy(precise)}`)
    // _permissionLogger(`useLocationPermissions#reduceResult => androidCanUseBackground: ${androidCanUseBackground(background)}`)
    if (iosCanUseAccuracy(precise)) {
        return granted && hasPreciseAccuracy(iosAccuracy)
    }
    else if (androidCanUseBackground(background)) {
        return granted && isGranted(androidBackgroundResult)
    }

    return granted
}

const reduceMultipleLocationResults = (results) => {
    if (containsUnavailable(results)) {
        return RESULTS.UNAVAILABLE
    } else if (containsDenied(results)) {
        return RESULTS.DENIED
    } else if (containsBlocked(results)) {
        return RESULTS.BLOCKED
    } else if (containsLimited(results)) {
        return RESULTS.LIMITED
    } else {
        return RESULTS.GRANTED
    }
}


// Utility hook that handles interacting with react-native-permissions and tracks permission state
export const useRequestLocationPermissions = (options={
    precise:true,
    background:false,
}) => {

    const { precise, background, iosFullAccuracyPurposeKey, androidHandleBackgroundPrompt } = options
    const [checkResult, setCheckResult] = useState()
    const [requestResult, setRequestResult] = useState()
    const [iosAccuracy, setIOSAccuracy] = useState()
    const [androidBackgroundCheck, setAndroidBackgroundCheck] = useState()
    const [androidBackgroundRequest, setAndroidBackgroundRequest] = useState()


    // Simplify the results from 'check()' and 'request()' down to one result
    // If we have a result from 'request()' use it instead of the one from 'check()'
    const result = useMemo(() => !isEmpty(requestResult) ? requestResult : checkResult, [requestResult, checkResult])


    // Same thing with Android's background permission
    // Use the result from 'request()' over 'check()'
    const androidBackgroundResult = useMemo(() => !isEmpty(androidBackgroundRequest) ?
        androidBackgroundRequest : androidBackgroundCheck, [androidBackgroundRequest, androidBackgroundCheck])


    // Compute the permissions needed based on the options parameter and what OS we're on
    const permissions = useMemo(() => {
        if (Platform.OS === `ios`) {
            return background ? [PERMISSIONS.IOS.LOCATION_ALWAYS] : [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]
        }
        else if (Platform.OS === `android`) {
            return precise ?
                [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] :
                [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]
        }
    }, [precise, background])


    /**
     * checkPermissions
     *
     * This uses react-native-permissions 'check' function to asynchronously check the state
     * of the location permissions the user needs.
     *
     * @returns {Array} An array containing the state of locations permissions conforming to the following shape:
     * [checkResult, iosAccuracy, androidBackgroundCheckResult]
     */
    const checkPermissions = useCallback(async () => {
        try {
            // Check for permissions using 'check'
            _permissionLogger(`useRequestLocationPermissions#checkPermissions => ${permissions}`)
            let _checkResult = await checkMultiple(permissions)
            _permissionLogger(`useRequestLocationPermissions#checkPermissions ${permissions} result => `, _checkResult)
            _checkResult = reduceMultipleLocationResults(_checkResult)

            // Save result for check separately from the result we get from 'request()' because Android 13 is a hellscape
            setCheckResult(_checkResult)

            // On iOS check if we're granted full accuracy if user needs it
            if (iosCanUseAccuracy(precise) && isGranted(_checkResult)) {
                const accuracy = await checkLocationAccuracy()
                _permissionLogger(`useRequestLocationPermissions#checkPermissions location accuracy => ${accuracy}`)
                // Save the level of accuracy available
                setIOSAccuracy(accuracy)
                return [_checkResult, accuracy]
            }
            // On Android check if we're granted for background location access if user needs it
            else if (androidCanUseBackground(background)) {
                _permissionLogger(`useRequestLocationPermissions#checkPermissions => ${androidBackgroundPermission}`)
                let backgroundResult = await check(androidBackgroundPermission)
                _permissionLogger(`useRequestLocationPermissions#checkPermissions ${androidBackgroundPermission} result => `, backgroundResult)
                // Save the result of 'check()' and keep it separate from the the result of 'request()' because of the aforementioned android 13 hellscape
                setAndroidBackgroundCheck(backgroundResult)
                return [_checkResult, null, backgroundResult]
            }

            return [_checkResult]
        } catch (err) {
            _permissionLogger(`useRequestLocationPermissions#checkPermissions => Got error checking for location permission: `, err)
        }
    }, [permissions, setCheckResult, precise, setIOSAccuracy, background, setAndroidBackgroundCheck])


    /**
     * requestPermissions
     *
     * This uses react-native-permissions to request needed location permissions and
     * stores the results so the hook can determine overall location state.
     *
     * @returns {string} The result of the last request made, defined by react-native-permissions RESULTS
     */
    const requestPermissions = useCallback(async () => {
        try {

            let requestResult = checkResult
            // Check if this permission is already granted
            if (!isGranted(requestResult)) {
                _permissionLogger(`useRequestLocationPermissions#requestPermission => ${permissions}`)
                // Request permission and save it separately from the result we got from 'check()'
                requestResult = await requestMultiple(permissions)
                _permissionLogger(`useRequestLocationPermissions#requestPermission ${permissions} result => `, requestResult)
                requestResult = reduceMultipleLocationResults(requestResult)
                setRequestResult(requestResult)
            }

            // On iOS request full accuracy if user needs it
            if (iosCanUseAccuracy(precise) && isGranted(requestResult) && !hasPreciseAccuracy(iosAccuracy)) {
                if (isEmpty(iosFullAccuracyPurposeKey)) {
                    throw Error(`No purpose key provided for full accuracy on iOS! See documentation`)
                }
                const accuracy = await requestLocationAccuracy({ purposeKey: iosFullAccuracyPurposeKey})
                _permissionLogger(`useRequestLocationPermissions#requestPermission => ${accuracy}`)
                setIOSAccuracy(accuracy)
            }

            // If this android and the user needs background permissions, request it with the base permission
            if (androidCanUseBackground(background) && !isGranted(androidBackgroundCheck)) {
                if (androidHandleBackgroundPrompt) {
                    await androidHandleBackgroundPrompt()
                }
                else {
                    await simpleAlertAsPromised({
                        title: `Background Location Permission Required`,
                        description: `This feature requires access location while the app isn't running. Please enable it by selecting 'Allow all the time' under in app settings.`,
                    })
                }


                _permissionLogger(`useRequestLocationPermissions#requestPermission => ${androidBackgroundPermission}`)
                let backgroundResult = await request(androidBackgroundPermission)
                _permissionLogger(`useRequestLocationPermissions#requestPermission ${androidBackgroundPermission} result => `, backgroundResult)
                setAndroidBackgroundRequest(backgroundResult)

                // If the base location permission was blocked then return that
                // Otherwise the background permission result is the most important thing here, return it
                return isBlocked(requestResult) ? requestResult : background
            }

            return requestResult
        } catch (err) {
            _permissionLogger(`Got error requesting location permission: `, err)
        }
    }, [
        permissions, checkResult, setRequestResult,
        precise, iosAccuracy, setIOSAccuracy, iosFullAccuracyPurposeKey,
        background, androidBackgroundCheck, setAndroidBackgroundRequest, androidHandleBackgroundPrompt,
    ])

    const onAppResume = useCallback(() => {
        _permissionLogger(`useRequestLocationPermissions#onAppResume resetting request state`)
        setRequestResult(null)
        checkPermissions()
    }, [checkPermissions, setRequestResult])


    // Check permissions on mount and app resume
    useAppResume(onAppResume)
    useMount(checkPermissions)

    return [result, iosAccuracy, androidBackgroundResult, checkPermissions, requestPermissions]
}



// Component-facing hook, reducing permission state down to boolean value based on given options.
// Provides functions to check current state and prompt user for to fix permissions
// Also handles the user-facing alert logic
export const useLocationPermissions = (options={ precise:false, background:true }, handlePrompt, handleBlocked=noop, handlePromptIOSAccuracy, handlePromptAndroidBackground) => {

    const { precise, background } = options
    const [result, iosAccuracy, androidBackgroundResult, checkPermissions, requestPermissions] = useRequestLocationPermissions(options)


    // Collapse permission state into a boolean
    const granted = useMemo(() =>(
        !isEmpty(result) ?
            reduceResult(result, precise, background, iosAccuracy, androidBackgroundResult) :
            undefined
    ),
    [result, precise, background, iosAccuracy, androidBackgroundResult])

    const blocked = useMemo(() => (
        androidCanUseBackground(background) ? (isBlocked(result) || isBlocked(androidBackgroundResult)) : isBlocked(result)
    ), [background, result, androidBackgroundResult])


    // Provide a function to poll permission state using checkPermissions from useRequestLocationPermissions
    // Under the hood this will use react-native-permissions 'check()' function
    // This will also collapse the result down to a boolean value for the user
    const checkGranted = useCallback(async () => {
        const [result, accuracy, androidBackground] = await checkPermissions()
        // _permissionLogger(`useLocationPermissions#checkGranted => result: ${result}, accuracy: ${accuracy}, androidBackground: ${androidBackground}`)
        const reduced = reduceResult(result, precise, background, accuracy, androidBackground)
        // _permissionLogger(`useLocationPermissions#checkGranted => reduced: `, reduced)
        return reduced
    }, [checkPermissions, precise, background])


    // Prompt user based on permission state
    const askForPermissions = useCallback(async () => {
        _permissionLogger(`useLocationPermissions#askForPermissions attempting to prompt user for permissions. Current: `, result)

        switch(result) {
            case RESULTS.UNAVAILABLE:
                _permissionLogger(`Location permission unavailable`)
                break
            case RESULTS.DENIED: {
                // Prompt user to enable permission
                if (handlePrompt) {
                    await handlePrompt()
                }
                else {
                    await alertAsPromised({
                        title: `Location Permission Required`,
                        description: `This feature requires access to your location. Please grant permission when requested.`,
                        actionText: `Continue`,
                    })
                }
                // Request permissions and store result
                let result = await requestPermissions()
                // If we're blocked, immediately show an alert to the user prompting them to go to app settings
                if (isBlocked(result)) {
                    handleBlocked(precise)
                }
                // Return whether the permission was granted
                return isGranted(result)
            }
            case RESULTS.LIMITED:
            case RESULTS.GRANTED:
                if (iosCanUseAccuracy(precise) && !hasPreciseAccuracy(iosAccuracy)) {
                    // The user has location enabled but not precise location
                    // The caller has indicated that precise location is required
                    // Alert the user to go to app settings and enable it
                    if (handlePromptIOSAccuracy) {
                        await handlePromptIOSAccuracy()
                    }
                    else {
                        await customAlertAsPromised(
                            `Precise Location Permission Required`,
                            `This feature requires access to your precise location. Please enable it by toggling on 'Precise Location' in app settings.`,
                            openSettingsButtons,
                        )
                    }
                }
                else if (androidCanUseBackground(background) && !isGranted(androidBackgroundResult)) {
                    _permissionLogger(`useLocationPermissions#askForPermissions => androidBackgroundResult: `, androidBackgroundResult)
                    // Check if background result was blocked
                    if (isBlocked(androidBackgroundResult)) {
                        if (handlePromptAndroidBackground) {
                            await handlePromptAndroidBackground()
                        }
                        else {
                            // Send user to settings
                            await customAlertAsPromised(
                                `Background Location Permission Required`,
                                `This feature requires access location while the app isn't running. Please enable it by selecting 'Allow all the time' in app settings.`,
                                openSettingsButtons,
                            )
                        }
                    }
                    else if (!isGranted(androidBackgroundResult)) {
                        let result = await requestPermissions()
                        if (isBlocked(result)) {
                            handleBlocked(false)
                        }
                        return isGranted(result)
                    }
                }
                else {
                    return true
                }
                break
            case RESULTS.BLOCKED:
                // User has explicitly denied permission. We can't show the authorization dialog anymore. Explain
                // to the user that they have to enable it in settings.
                await handleBlocked(precise)
                break
        }
        return false
    }, [result, iosAccuracy, precise, requestPermissions, androidBackgroundResult, background, handlePrompt, handleBlocked, handlePromptIOSAccuracy, handlePromptAndroidBackground])

    useMount(checkGranted)

    return [granted, blocked, checkGranted, askForPermissions]
}
