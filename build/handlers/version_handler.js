'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getLatestVersionCode = getLatestVersionCode;
var AppVersion = require('../models').AppVersion;
var LATEST_APP_VERSION = require('../config/config').LATEST_APP_VERSION;

function* getLatestVersionCode() {
    var appVersion = yield AppVersion.findOne({});
    if (appVersion == null) {
        appVersion = LATEST_APP_VERSION;
    }
    return { versionCode: appVersion };
}