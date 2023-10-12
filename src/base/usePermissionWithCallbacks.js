import { useMemo, useCallback } from 'react'
import { RESULTS } from 'react-native-permissions'

import isEmpty from 'lodash/isEmpty'
import noop from 'lodash/noop'

import { _permissionLogger } from '../utils/logger'
import { usePermission } from './usePermission'
import { isBlocked, isGranted } from '../utils'


export const usePermissionWithCallbacks = (permission, handlePrompt=noop, handleBlocked=noop) => {
    const [result, check, request] = usePermission(permission)

    const granted = useMemo(() => !isEmpty(result) ? isGranted(result) : undefined, [result])
    const blocked = useMemo(() => !isEmpty(result) ? isBlocked(result) : undefined, [result])

    const fetchGranted = useCallback(async () => {
        const _result = await check(permission)
        return isGranted(_result)
    }, [check, permission])

    const prompt = useCallback(async () => {
        switch(result) {
            case RESULTS.UNAVAILABLE:
                _permissionLogger(`usePermissionWithCallbacks#prompt permission: ${permission} unavailable`)
                break
            case RESULTS.DENIED: {
                // Prompt user to enable permission
                await handlePrompt()
                let _result = await request()
                if (isBlocked(_result)) {
                    handleBlocked()
                }
                return isGranted(_result)
            }
            case RESULTS.LIMITED:
            case RESULTS.GRANTED:
                return true
            case RESULTS.BLOCKED:
                await handleBlocked()
                break
        }
        return false
    }, [result, request, permission, handleBlocked, handlePrompt])

    return [granted, blocked, fetchGranted, prompt]
}
