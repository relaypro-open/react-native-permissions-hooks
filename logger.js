const DEBUG = false

export const _permissionLogger = (...args) => {
    if (DEBUG) {
        console.log(...args)
    }
}
