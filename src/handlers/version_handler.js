var Boom = require('boom')
var AppVersion = require('../models').AppVersion

const LATEST_APP_VERSION = require('../config/config').LATEST_APP_VERSION;
export function* getLatestVersionCode() {
    var appVersion = yield AppVersion.findOne({}, {'_id':0})
    if(appVersion == null) {
        appVersion = LATEST_APP_VERSION;
    }
    return appVersion;
}

export function* updateLatestVersion(versionCode) {
    var appVersion = yield AppVersion.findOne({})
    if(appVersion == null) {
        appVersion = new AppVersion({versionCode: versionCode})
    } else {
        appVersion.versionCode = versionCode
    }

    yield appVersion.save()
    return Boom.OK();
}
