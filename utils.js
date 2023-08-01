import { RESULTS, openSettings } from 'react-native-permissions'

import values from 'lodash/values'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'


export const isGranted = (result) => (result === RESULTS.GRANTED || result === RESULTS.LIMITED)
export const isBlocked = (result) => (result === RESULTS.BLOCKED)
export const isGrantedMultiple = (results) => (find(values(results), result => !isGranted(result)) === undefined)
export const containsDenied = (results) => (!isEmpty(find(values(results), result => result === RESULTS.DENIED)))
export const containsBlocked = (results) => (!isEmpty(find(values(results), result => isBlocked(result))))
export const containsUnavailable = (results) => (!isEmpty(find(values(results), result => result === RESULTS.UNAVAILABLE)))
export const containsLimited = (results) => (!isEmpty(find(values(results), result => result === RESULTS.LIMITED)))


export const openSettingsButtons = [
    {text: `OK`},
    {text: `Open Settings`, onPress: openSettings}
]
