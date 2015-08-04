var AppVersion = require('../models').AppVersion
const LATEST_APP_VERSION = require('../config/config').LATEST_APP_VERSION;
export function* getLatestVersionCode() {
    var appVersion = yield AppVersion.findOne({})
    if(appVersion == null) {
        appVersion = LATEST_APP_VERSION;
    }
    return {versionCode: appVersion};
}
