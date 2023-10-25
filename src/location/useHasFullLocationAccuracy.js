import { useCallback, useMemo } from 'react'
import { Platform } from 'react-native'

import constant from 'lodash/constant'
import noop from 'lodash/noop'

import { useIOSLocationAccuracy } from './useIOSLocationAccuracy'
import { IOS_ACCURACY_AVAILABLE } from '../utils'
import { usePermissionWithCallbacks } from '../base'
import { PERMISSIONS } from 'react-native-permissions'



const rubberStamp = constant([true, constant(true), constant(true)])

const _useIOSHasFullLocationAccuracy = (purposeKey, handlePrompt=noop) => {
    const [accuracy, check, request] = useIOSLocationAccuracy(purposeKey)
    const hasAccuracy = useMemo(() => accuracy === `full`, [accuracy])

    const _check = useCallback(async () => {
        const result = await check()
        return result === `full`
    }, [check])

    const _request = useCallback(async () => {
        await (handlePrompt)
        const result = await request()
        return result === `full`
    }, [request, handlePrompt])

    return [hasAccuracy, _check, _request]
}

const _useAndroidHasFullLocationAccuracy = (_, handlePrompt=noop, handleBlocked=noop) => {
    const [granted,, fetchGranted, request] = usePermissionWithCallbacks(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, handlePrompt, handleBlocked)
    return [granted, fetchGranted, request]
}


export const useHasFullLocationAccuracy = Platform.select({
    ios: IOS_ACCURACY_AVAILABLE ? _useIOSHasFullLocationAccuracy : rubberStamp,
    android: _useAndroidHasFullLocationAccuracy
})
