import { useEffect } from 'react'

const useMount = (fn) => {
    useEffect(() => {
        fn && fn()
    }, [])
}

export default useMount
