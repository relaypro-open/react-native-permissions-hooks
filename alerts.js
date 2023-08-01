import { Alert } from 'react-native'

import map from 'lodash/map'

export const customAlertAsPromised = (title, description, buttons=[], options) => {
    return new Promise((resolve, reject) => {
        // Loop through all the buttons and wrap their onPress so we can resolve a promise
        const _buttons = map(buttons, ({ text, onPress, style }) => {
            const wrappedCallback = async () => {
                try {
                    const result = onPress && await onPress()
                    // If this a cancel button, reject instead
                    if (style === `cancel`) {
                        reject(result)
                    }
                    else {
                        resolve(result)
                    }
                } catch (err) {
                    console.log(`Error in alert: `, err)
                    reject()
                }
            }
            return {
                text,
                onPress: wrappedCallback,
                style,
            }
        })

        Alert.alert(title, description, _buttons, { ...options, onDismiss: reject })
    })
}

export const alertAsPromised = ({ title, description, actionText=`Continue`, cancelText=`Cancel`}={}) => {
    return new Promise((resolve, reject) => {
        Alert.alert(
            title,
            description,
            [
                { text: cancelText, onPress: reject, style: `cancel` },
                { text: actionText, onPress: resolve }
            ],
            { onDismiss: reject }
        )
    })
}

export const simpleAlertAsPromised = ({ title, description, actionText=`OK` }={}) => {
    return new Promise((resolve) => {
        Alert.alert(
            title,
            description,
            [
                { text: actionText, onPress: resolve },
            ],
            { cancelable: false }
        )
    })
}
