import {LATEST_APP_VERSION} from '../config/config.js'

export function* getLatestVersionCode() {
    return {versionCode: LATEST_APP_VERSION};
}
