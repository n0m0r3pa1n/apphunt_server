var rp = require('request-promise')
var _ = require('underscore')

export var FLURRY_BASE_URL = "https://api.flurry.com/"
export var FLURRY_API_ACCESS_CODE = "K3DM6PJMTV58CRN4MK6Q"
export var FLURRY_API_KEY = "TF65K4T659FTCPXGMNG3"

export var FLURRY_GENERAL_STATS_URL = FLURRY_BASE_URL + "eventMetrics/Summary?apiAccessCode="+FLURRY_API_ACCESS_CODE+"&apiKey=" +
    FLURRY_API_KEY
export var FLURRY_EVENT_URL = FLURRY_BASE_URL + "eventMetrics/Event?apiAccessCode="+FLURRY_API_ACCESS_CODE+"&apiKey=" +
    FLURRY_API_KEY
export var FLURRY_APP_INFO_URL = FLURRY_BASE_URL + "appInfo/getApplication?apiAccessCode="+FLURRY_API_ACCESS_CODE+"&apiKey=" + FLURRY_API_KEY


function* getInstalledPackages(fromDate, toDate, version) {
    let url = FLURRY_EVENT_URL + "&startDate=" + fromDate + "&endDate=" + toDate + "&eventName=user.opened.app.in.market"
    if (version != undefined && version !== "all") {
        url += "&versionName=" + version
    }

    var data = yield rp.get(url)
    return parseEventDetails(JSON.parse(data))
}

function parseEventDetails(eventDetails) {
    var values = []
    if(Array.isArray(eventDetails.parameters.key)) {
        for(var index in eventDetails.parameters.key) {
            var key = eventDetails.parameters.key[index]
            if(key["@name"] == "appPackage") {
                values = key.value
                break
            }
        }
    } else {
        values = eventDetails.parameters.key.value
    }
    var sortedValues = _.sortBy(values, function(value) {
        return Number(value["@totalCount"])
    })
    sortedValues.reverse()
    return sortedValues
}

module.exports.getInstalledPackages = getInstalledPackages
