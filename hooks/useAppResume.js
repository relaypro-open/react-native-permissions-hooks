import { useEffect } from 'react'
import { AppState } from 'react-native'

import noop from 'lodash/noop'


const useAppResume = (onAppResume=noop) => {
    useEffect(() => {
        const listener = AppState.addEventListener(onAppResume)
        return listener.remove
    }, [onAppResume])
}

export default useAppResume
