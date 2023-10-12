// eslint-disable-next-line import/no-unused-modules
import * as base from './src/base'
import * as location from './src/location'
import * as utils from './src/utils'
import * as camera from './src/useCameraPermission'
import * as notifications from './src/useNotificationsPermissions'

// Generic hooks to handle permission state
export const useMultiplePermissions  = base.useMultiplePermissions
export const useMultiplePermissionsWithCallbacks = base.useMultiplePermissionsWithCallbacks
export const usePermission = base.usePermission
export const usePermissionWithCallbacks = base.usePermissionWithCallbacks

// Location permissions hooks
export const useHasFullLocationAccuracy = location.useHasFullLocationAccuracy
export const useLocationPermissions = location.useLocationPermissions

// General permissions hooks
export const useCameraPermission = camera.useCameraPermission
export const useNotificationsPermission = notifications.useNotificationsPermission


// Helper functions
export const isGranted = utils.isGranted
export const isBlocked = utils.isBlocked
export const isGrantedMultiple = utils.isGrantedMultiple
export const containsDenied = utils.containsDenied
export const containsBlocked = utils.containsBlocked
export const containsUnavailable = utils.containsUnavailable
export const containsLimited = utils.containsLimited
export const reduceMultipleResults = utils.reduceMultipleResults

// Constant to indicate if iOS version supports requesting accuracy
export const IOS_ACCURACY_AVAILABLE = utils.IOS_ACCURACY_AVAILABLE


export default {
    useMultiplePermissions,
    useMultiplePermissionsWithCallbacks,
    usePermission,
    usePermissionWithCallbacks,
    useHasFullLocationAccuracy,
    useLocationPermissions,
    useCameraPermission,
    useNotificationsPermission,
    isGranted,
    isBlocked,
    isGrantedMultiple,
    containsDenied,
    containsBlocked,
    containsUnavailable,
    containsLimited,
    reduceMultipleResults,
    IOS_ACCURACY_AVAILABLE,
}
