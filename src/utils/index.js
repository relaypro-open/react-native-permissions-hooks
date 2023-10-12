import { RESULTS, openSettings } from 'react-native-permissions'
import { Platform } from 'react-native'

import values from 'lodash/values'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'


export const IOS_ACCURACY_AVAILABLE = Platform.OS === `ios` && parseInt(Platform.Version, 10) >= 14

export const isGranted = (result) => (result === RESULTS.GRANTED || result === RESULTS.LIMITED)
export const isBlocked = (result) => (result === RESULTS.BLOCKED)
export const isGrantedMultiple = (results) => (find(values(results), result => !isGranted(result)) === undefined)
export const containsDenied = (results) => (!isEmpty(find(values(results), result => result === RESULTS.DENIED)))
export const containsBlocked = (results) => (!isEmpty(find(values(results), result => isBlocked(result))))
export const containsUnavailable = (results) => (!isEmpty(find(values(results), result => result === RESULTS.UNAVAILABLE)))
export const containsLimited = (results) => (!isEmpty(find(values(results), result => result === RESULTS.LIMITED)))

export const reduceMultipleResults = (results) => {
    if (containsUnavailable(results)) {
        return RESULTS.UNAVAILABLE
    } else if (containsBlocked(results)) {
        return RESULTS.BLOCKED
    } else if (containsDenied(results)) {
        return RESULTS.DENIED
    } else if (containsLimited(results)) {
        return RESULTS.LIMITED
    } else {
        return RESULTS.GRANTED
    }
}


export const openSettingsButtons = [
    {text: `OK`},
    {text: `Open Settings`, onPress: openSettings}
]

export * from './hooks/useAppResume'
export * from './hooks/useMount'
