var DEVS_HUNTER_URL = 'http://devs-hunter.herokuapp.com'
var STATUS_CODES = require('./status_codes').STATUS_CODES
var GCM_API_KEY = "AIzaSyC52GhMMCZPKyYYuQcNxFuDUg5nOZXmTSs"
var API_VERSION = 1.0;
var MIN_APPS_LENGTH_FOR_COLLECTION = 4

var Android = "Android"
var iOS = "iOS"
var platforms = {
    Android: "Android",
    iOS: "iOS"
}

var appStatuses = {
    REJECTED: "rejected",
    WAITING: "waiting",
    APPROVED: "approved"
}

var collectionStatuses = {
    PUBLIC: "public",
    DRAFT: "draft"
}

var appStatusesFilter = {
    REJECTED: "rejected",
    WAITING: "waiting",
    APPROVED: "approved",
    ALL: "all"
}

var loginTypes = {
    Facebook: "facebook",
    GooglePlus: "google-plus",
    Twitter: "twitter",
    Custom: "custom",
    Fake: "fake"
}

var notificationTypes = {
    APP_APPROVED: "appApproved",
    APP_REJECTED: "appRejected",
    USER_COMMENT: "userComment",
    USER_MENTIONED: "userMentioned"
}

var bitly =  {
        url: "https://api-ssl.BITLY.com/v3/user/link_save?",
        user: "naughtyspirit",
        apiKey: "c068748d49c9fa346083e6fcaf343b67b7f8492c"
}

var boltAppId = "54ef44e5fa12501100634591"

var EMAIL_TEMPLATES_PATH = "assets/templates/email/"
var APP_HUNT_EMAIL = "apphunt@naughtyspirit.co"
var APP_HUNT_TWITTER_HANDLE = "TheAppHunt"

module.exports.DEVS_HUNTER_URL = DEVS_HUNTER_URL
module.exports.GCM_API_KEY = GCM_API_KEY
module.exports.API_VERSION = API_VERSION
module.exports.STATUS_CODES = STATUS_CODES
module.exports.Android = Android
module.exports.iOS = iOS
module.exports.PLATFORMS = platforms
module.exports.APP_STATUSES = appStatuses
module.exports.COLLECTION_STATUSES = collectionStatuses
module.exports.APP_STATUSES_FILTER = appStatusesFilter
module.exports.NOTIFICATION_TYPES = notificationTypes
module.exports.LOGIN_TYPES = loginTypes
module.exports.BITLY = bitly
module.exports.BOLT_APP_ID = boltAppId
module.exports.EMAIL_TEMPLATES_PATH = EMAIL_TEMPLATES_PATH
module.exports.APP_HUNT_EMAIL = APP_HUNT_EMAIL
module.exports.APP_HUNT_TWITTER_HANDLE = APP_HUNT_TWITTER_HANDLE
module.exports.MIN_APPS_LENGTH_FOR_COLLECTION = MIN_APPS_LENGTH_FOR_COLLECTION