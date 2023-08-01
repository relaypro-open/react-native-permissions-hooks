import { useMemo, useCallback } from 'react'

import isEmpty from 'lodash/isEmpty'
import noop from 'lodash/noop'

import { _permissionLogger } from './logger'
import useMultiplePermissions from './useMultiplePermissions'
import { isGrantedMultiple, containsBlocked, containsUnavailable, containsDenied } from './utils'


const useMultiplePermissionsWithCallbacks = (permissions, handlePrompt=noop, handleBlocked=noop) => {
    const [results, check, request]  = useMultiplePermissions(permissions)

    const granted = useMemo(() => !isEmpty(results) ? isGrantedMultiple(results) : undefined, [results])
    const blocked = useMemo(() => !isEmpty(results) ? containsBlocked(results) : undefined, [results])

    const fetchGranted = useCallback(async () => {
        const _result = await check(permissions)
        return isGrantedMultiple(_result)
    }, [check, permissions])

    const prompt = useCallback(async () => {
        if (containsUnavailable(results)) {
            _permissionLogger(`useMultiplePermissionsWithCallbacks#prompt permissions: ${permissions} unavailable`)
        }
        else if (containsDenied(results)) {
            await handlePrompt()
            let results = await request()
            if (containsBlocked(results)) {
                handleBlocked(results)
            }
            return isGrantedMultiple(results)
        }
        else if (isGrantedMultiple(results)) {
            return true
        }
        else if (containsBlocked(results)) {
            await handleBlocked(results)
        }
        return false
    }, [results, request, permissions, handleBlocked, handlePrompt])

    return [granted, blocked, fetchGranted, prompt]
}

export default useMultiplePermissionsWithCallbacks
