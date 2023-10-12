const DEBUG = true

export const _permissionLogger = (...args) => {
    if (DEBUG) {
        console.log(`[RN_PERM_HOOKS]: `, ...args)
    }
}
