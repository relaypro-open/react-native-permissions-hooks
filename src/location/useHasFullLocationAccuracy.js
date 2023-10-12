import { useCallback, useMemo } from 'react'
import { Platform } from 'react-native'

import constant from 'lodash/constant'

import { useIOSLocationAccuracy } from './useIOSLocationAccuracy'
import { IOS_ACCURACY_AVAILABLE } from '../utils'



const rubberStamp = constant([true, constant(true), constant(true)])

const _useHasFullLocationAccuracy = (purposeKey) => {
    const [accuracy, check, request] = useIOSLocationAccuracy(purposeKey)
    const hasAccuracy = useMemo(() => accuracy === `full`, [accuracy])

    const _check = useCallback(async () => {
        const result = await check()
        return result === `full`
    }, [check])

    const _request = useCallback(async () => {
        const result = await request()
        return result === `full`
    }, [request])

    return [hasAccuracy, _check, _request]
}


export const useHasFullLocationAccuracy = Platform.select({
    ios: IOS_ACCURACY_AVAILABLE ? _useHasFullLocationAccuracy : rubberStamp,
    android: rubberStamp
})
