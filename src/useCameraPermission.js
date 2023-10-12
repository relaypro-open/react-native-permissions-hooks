import { Platform } from 'react-native'
import { PERMISSIONS } from 'react-native-permissions'

import noop from 'lodash/noop'

import { usePermissionWithCallbacks } from './base'


const cameraPermission = Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
})

export const useCameraPermission = (handlePrompt=noop, handleBlocked=noop) => (
    usePermissionWithCallbacks(cameraPermission, handlePrompt, handleBlocked)
)
