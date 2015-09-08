"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var DEVS_HUNTER_URL = "http://devs-hunter.herokuapp.com";
var GCM_API_KEY = "AIzaSyC52GhMMCZPKyYYuQcNxFuDUg5nOZXmTSs";
var API_VERSION = 1.0;
var MIN_APPS_LENGTH_FOR_COLLECTION = 4;

var Android = "Android";
var iOS = "iOS";
var platforms = {
    Android: "Android",
    iOS: "iOS"
};

var appStatuses = {
    REJECTED: "rejected",
    WAITING: "waiting",
    APPROVED: "approved"
};

var collectionStatuses = {
    PUBLIC: "public",
    DRAFT: "draft"
};

var tagTypes = {
    COLLECTION: "collection",
    APPLICATION: "application"
};

var appStatusesFilter = {
    REJECTED: "rejected",
    WAITING: "waiting",
    APPROVED: "approved",
    ALL: "all"
};

var loginTypes = {
    Facebook: "facebook",
    GooglePlus: "google-plus",
    Twitter: "twitter",
    Custom: "custom",
    Fake: "fake"
};

var notificationTypes = {
    APP_APPROVED: "appApproved",
    APP_REJECTED: "appRejected",
    USER_COMMENT: "userComment",
    USER_MENTIONED: "userMentioned",
    TOP_HUNTERS: "topHunters",
    TOP_APPS: "topApps",
    GENERIC: "generic"
};

var bitly = {
    url: "https://api-ssl.BITLY.com/v3/user/link_save?",
    user: "naughtyspirit",
    apiKey: "c068748d49c9fa346083e6fcaf343b67b7f8492c"
};

var boltAppId = "54ef44e5fa12501100634591";

var EMAIL_TEMPLATES_PATH = "assets/templates/email/";
var APP_HUNT_EMAIL = "apphunt@naughtyspirit.co";
var APP_HUNT_TWITTER_HANDLE = "TheAppHunt";

var PRIVATE_KEY = "AppHunt!#Private";
exports.PRIVATE_KEY = PRIVATE_KEY;
var AUTH_TYPE = "jwt";

exports.AUTH_TYPE = AUTH_TYPE;
module.exports.LATEST_APP_VERSION = { versionCode: 21 };
module.exports.DEVS_HUNTER_URL = DEVS_HUNTER_URL;
module.exports.GCM_API_KEY = GCM_API_KEY;
module.exports.API_VERSION = API_VERSION;
module.exports.Android = Android;
module.exports.iOS = iOS;
module.exports.PLATFORMS = platforms;
module.exports.APP_STATUSES = appStatuses;
module.exports.TAG_TYPES = tagTypes;
module.exports.COLLECTION_STATUSES = collectionStatuses;
module.exports.APP_STATUSES_FILTER = appStatusesFilter;
module.exports.NOTIFICATION_TYPES = notificationTypes;
module.exports.LOGIN_TYPES = loginTypes;
module.exports.BITLY = bitly;
module.exports.BOLT_APP_ID = boltAppId;
module.exports.EMAIL_TEMPLATES_PATH = EMAIL_TEMPLATES_PATH;
module.exports.APP_HUNT_EMAIL = APP_HUNT_EMAIL;
module.exports.APP_HUNT_TWITTER_HANDLE = APP_HUNT_TWITTER_HANDLE;
module.exports.MIN_APPS_LENGTH_FOR_COLLECTION = MIN_APPS_LENGTH_FOR_COLLECTION;
module.exports.STATUS_CODES = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    METHOD_NOT_ALLOWED: 405
};