import { useState, useMemo, useCallback } from 'react'
import { check, request } from "react-native-permissions"

import isEmpty from 'lodash/isEmpty'

import { _permissionLogger } from '../utils/logger'
import { useAppResume, useMount } from '../utils'

export const usePermission = (permission) => {
    const [checkResult, setCheckResult] = useState()
    const [requestResult, setRequestResult] = useState()

    const result = useMemo(() =>
        !isEmpty(requestResult) ? requestResult : checkResult,
    [requestResult, checkResult])

    const _check = useCallback(async () => {
        _permissionLogger(`usePermission#check => ${permission}`)
        let checkResult = await check(permission)
        _permissionLogger(`usePermission#check `, permission, `result => ${checkResult}`)
        setCheckResult(checkResult)
        return checkResult
    }, [permission, setCheckResult])

    const _request = useCallback(async () => {
        _permissionLogger(`usePermission#request => ${permission}`)
        let requestResult = await request(permission)
        _permissionLogger(`usePermission#request `, permission, `result => ${requestResult}`)
        setRequestResult(requestResult)
        return requestResult
    }, [permission, setRequestResult])

    const onAppResume = useCallback(() => {
        _permissionLogger(`usePermission#onAppResume resetting request state`)
        setRequestResult(null)
        _check()
    }, [_check, setRequestResult])

    useMount(_check)
    useAppResume(onAppResume)

    return [result, _check, _request]
}
