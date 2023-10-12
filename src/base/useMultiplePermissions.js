import { useState, useMemo, useCallback } from 'react'
import { checkMultiple, requestMultiple } from 'react-native-permissions'

import isEmpty from 'lodash/isEmpty'

import { _permissionLogger } from '../utils/logger'
import { useAppResume, useMount } from '../utils'


export const useMultiplePermissions = (permissions) => {
    const [checkResult, setCheckResult] = useState()
    const [requestResult, setRequestResult] = useState()

    const result = useMemo(() =>
        !isEmpty(requestResult) ? requestResult : checkResult,
    [requestResult, checkResult])

    const _check = useCallback(async () => {
        _permissionLogger(`useMultiplePermissions#check => `, permissions)
        let checkResult = await checkMultiple(permissions)
        _permissionLogger(`useMultiplePermissions#check `, permissions, `result => `, checkResult)
        setCheckResult(checkResult)
        return checkResult
    }, [permissions, setCheckResult])

    const _request = useCallback(async () => {
        _permissionLogger(`useMultiplePermissions#request => `, permissions)
        let requestResult = await requestMultiple(permissions)
        _permissionLogger(`useMultiplePermissions#request `, permissions, `result => `, requestResult)
        setRequestResult(requestResult)
        return requestResult
    }, [permissions, setRequestResult])

    const onAppResume = useCallback(() => {
        _permissionLogger(`useMultiplePermissions#onAppResume resetting request state`)
        setRequestResult(null)
        _check()
    }, [_check, setRequestResult])

    useMount(_check)
    useAppResume(onAppResume)

    return [result, _check, _request]
}
