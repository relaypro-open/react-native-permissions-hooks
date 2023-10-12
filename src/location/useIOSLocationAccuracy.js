import { useCallback, useState } from 'react'
import { Platform } from 'react-native'
import { checkLocationAccuracy, requestLocationAccuracy } from 'react-native-permissions'

import constant from 'lodash/constant'
import noop from 'lodash/noop'

import { _permissionLogger } from '../utils/logger'
import { IOS_ACCURACY_AVAILABLE, useMount, useAppResume } from '../utils'


const _useIOSLocationAccuracy = (purposeKey) => {

    const [accuracy, setAccuracy] = useState()

    const check = useCallback(async () => {
        try {
            _permissionLogger(`useIOSLocationAccuracy#check`)
            let accuracy = await checkLocationAccuracy()
            _permissionLogger(`useIOSLocationAccuracy#check => Got accuracy: ${accuracy}`)
            setAccuracy(accuracy)
            return accuracy
        } catch (err) {
            // catch error when permission not granted
        }
    }, [setAccuracy])

    const request = useCallback(async () => {
        _permissionLogger(`useIOSLocationAccuracy#request`)
        let accuracy = await requestLocationAccuracy({ purposeKey })
        _permissionLogger(`useIOSLocationAccuracy#request => Got accuracy: ${accuracy}`)
        setAccuracy(accuracy)
        return accuracy
    }, [setAccuracy, purposeKey])

    useMount(check)
    useAppResume(check)

    return [accuracy, check, request]
}


export const useIOSLocationAccuracy = Platform.select({
    ios: IOS_ACCURACY_AVAILABLE ? _useIOSLocationAccuracy : constant([`full`, noop, noop]),
    android: constant([null, noop, noop])
})
