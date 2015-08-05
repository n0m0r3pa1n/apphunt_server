'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getLatestVersionCode = getLatestVersionCode;
exports.updateLatestVersion = updateLatestVersion;
var Boom = require('boom');
var AppVersion = require('../models').AppVersion;

var LATEST_APP_VERSION = require('../config/config').LATEST_APP_VERSION;

function* getLatestVersionCode() {
    var appVersion = yield AppVersion.findOne({}, { '_id': 0 });
    if (appVersion == null) {
        appVersion = LATEST_APP_VERSION;
    }
    return appVersion;
}

function* updateLatestVersion(versionCode) {
    var appVersion = yield AppVersion.findOne({});
    if (appVersion == null) {
        appVersion = new AppVersion({ versionCode: versionCode });
    } else {
        appVersion.versionCode = versionCode;
    }

    yield appVersion.save();
    return Boom.OK();
}