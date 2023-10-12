import { useCallback, useEffect } from 'react'
import { AppState } from 'react-native'

import noop from 'lodash/noop'


export const useAppResume = (onAppResume=noop) => {
    const onChange = useCallback((nextAppState) => {
        if (nextAppState === `active`) {
            onAppResume()
        }
    }, [onAppResume])

    useEffect(() => {
        const listener = AppState.addEventListener(`change`, onChange)
        return listener.remove
    }, [onChange])
}
