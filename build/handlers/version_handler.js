'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getLatestVersionCode = getLatestVersionCode;

var _configConfigJs = require('../config/config.js');

function* getLatestVersionCode() {
    return { versionCode: _configConfigJs.LATEST_APP_VERSION };
}