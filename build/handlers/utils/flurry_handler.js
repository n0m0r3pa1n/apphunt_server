'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var rp = require('request-promise');
var _ = require('underscore');

var FLURRY_BASE_URL = "https://api.flurry.com/";
exports.FLURRY_BASE_URL = FLURRY_BASE_URL;
var FLURRY_API_ACCESS_CODE = "K3DM6PJMTV58CRN4MK6Q";
exports.FLURRY_API_ACCESS_CODE = FLURRY_API_ACCESS_CODE;
var FLURRY_API_KEY = "TF65K4T659FTCPXGMNG3";

exports.FLURRY_API_KEY = FLURRY_API_KEY;
var FLURRY_GENERAL_STATS_URL = FLURRY_BASE_URL + "eventMetrics/Summary?apiAccessCode=" + FLURRY_API_ACCESS_CODE + "&apiKey=" + FLURRY_API_KEY;
exports.FLURRY_GENERAL_STATS_URL = FLURRY_GENERAL_STATS_URL;
var FLURRY_EVENT_URL = FLURRY_BASE_URL + "eventMetrics/Event?apiAccessCode=" + FLURRY_API_ACCESS_CODE + "&apiKey=" + FLURRY_API_KEY;
exports.FLURRY_EVENT_URL = FLURRY_EVENT_URL;
var FLURRY_APP_INFO_URL = FLURRY_BASE_URL + "appInfo/getApplication?apiAccessCode=" + FLURRY_API_ACCESS_CODE + "&apiKey=" + FLURRY_API_KEY;

exports.FLURRY_APP_INFO_URL = FLURRY_APP_INFO_URL;
function* getInstalledPackages(fromDate, toDate, version) {
    var url = FLURRY_EVENT_URL + "&startDate=" + fromDate + "&endDate=" + toDate + "&eventName=user.opened.app.in.market";
    if (version != undefined && version !== "all") {
        url += "&versionName=" + version;
    }
    var data = yield rp.get(url);
    data = typeof data == "string" ? JSON.parse(data) : data;
    return parseEventDetails(data);
}

function parseEventDetails(eventDetails) {
    var values = [];
    if (Array.isArray(eventDetails.parameters.key)) {
        for (var index in eventDetails.parameters.key) {
            var key = eventDetails.parameters.key[index];
            if (key["@name"] == "appPackage") {
                values = key.value;
                break;
            }
        }
    } else {
        values = eventDetails.parameters.key.value;
    }
    var sortedValues = _.sortBy(values, function (value) {
        return Number(value["@totalCount"]);
    });
    sortedValues.reverse();
    return sortedValues;
}

module.exports.getInstalledPackages = getInstalledPackages;