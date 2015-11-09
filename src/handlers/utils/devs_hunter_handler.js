var rp = require('request-promise');
var CONFIG = require('../../config/config')
var DEVS_HUNTER_URL = CONFIG.DEVS_HUNTER_URL
var STATUS_CODES = CONFIG.STATUS_CODES

function* getAndroidApp(packageName) {
    var response = JSON.parse(yield rp(DEVS_HUNTER_URL + '/apps/' + packageName))
    if(response.statusCode !== STATUS_CODES.OK) {
        return null;
    }

    return response.app;
}

function* updateAndroidApp(packageName) {
    var options = {
        method: 'PUT',
        uri: DEVS_HUNTER_URL + '/apps/' + packageName,
    };

    var response = JSON.parse(yield rp(options))
    if(response.statusCode !== STATUS_CODES.OK) {
        return null;
    }

    return response.app;
}

module.exports.getAndroidApp = getAndroidApp
module.exports.updateAndroidApp = updateAndroidApp