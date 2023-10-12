import { useState, useMemo, useCallback } from 'react'
import { checkNotifications, requestNotifications } from 'react-native-permissions'

import isEmpty from 'lodash/isEmpty'

import { isBlocked, isGranted, useMount, useAppResume } from './utils'
import { _permissionLogger } from './utils/logger'


export const useNotificationsPermission = (iosNotificationOptions) => {

    const [checkResult, setCheckResult] = useState()
    const [requestResult, setRequestResult] = useState()

    const result = useMemo(() =>
        !isEmpty(requestResult) ? requestResult : checkResult,
    [requestResult, checkResult])

    const check = useCallback(async () => {
        let { status } = await checkNotifications()
        _permissionLogger(`useNotificationsPermission#check result => ${status}`)
        setCheckResult(status)
        return status
    }, [setCheckResult])

    const request = useCallback(async () => {
        let { status } = await requestNotifications(iosNotificationOptions)
        _permissionLogger(`useNotificationsPermission#request result => ${status}`)
        setRequestResult(status)
        return status
    }, [setRequestResult, iosNotificationOptions])

    const onAppResume = useCallback(() => {
        _permissionLogger(`useNotificationsPermission#onAppResume resetting request state`)
        setRequestResult(null)
        check()
    }, [check, setRequestResult])


    const granted = useMemo(() => !isEmpty(result) ? isGranted(result) : undefined, [result])
    const blocked = useMemo(() => !isEmpty(result) ? isBlocked(result) : undefined, [result])


    const fetchGranted = useCallback(async () => {
        const _result = await check()
        return isGranted(_result)
    }, [check])


    useMount(check)
    useAppResume(onAppResume)

    return [granted, blocked, fetchGranted, request]
}
