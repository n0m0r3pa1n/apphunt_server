var GCM_API_KEY = "AIzaSyC52GhMMCZPKyYYuQcNxFuDUg5nOZXmTSs"
var API_VERSION = 1.0;

var Android = "Android"
var iOS = "iOS"
var platforms = {
    Android: "Android",
    iOS: "iOS"
}

var appStatuses = {
    WAITING: "waiting",
    APPROVED: "approved"
}

var appStatusesFilter = {
    WAITING: "waiting",
    APPROVED: "approved",
    ALL: "all"
}

var loginTypes = {
    Facebook: "facebook",
    GooglePlus: "google-plus",
    Twitter: "twitter",
    Custom: "custom"
}

var STATUS_CODES = {
    CONTINUE: 100,
    SWITCHING_PROTOCOLS: 101,
    PROCESSING: 102,
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NON_AUTHORITATIVE_INFORMATION: 203,
    NO_CONTENT: 204,
    RESET_CONTENT: 205,
    PARTIAL_CONTENT: 206,
    MULTI_STATUS: 207,
    MULTIPLE_CHOICES: 300,
    MOVED_PERMANENTLY: 301,
    MOVED_TEMPORARILY: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    USE_PROXY: 305,
    TEMPORARY_REDIRECT: 307,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    PROXY_AUTHENTICATION_REQUIRED: 407,
    REQUEST_TIME_OUT: 408,
    CONFLICT: 409,
    GONE: 410,
    LENGTH_REQUIRED: 411,
    PRECONDITION_FAILED: 412,
    REQUEST_ENTITY_TOO_LARGE: 413,
    REQUEST_URI_TOO_LARGE: 414,
    UNSUPPORTED_MEDIA_TYPE: 415,
    REQUESTED_RANGE_NOT_SATISFIABLE: 416,
    EXPECTATION_FAILED: 417,
    IM_A_TEAPOT: 418,
    UNPROCESSABLE_ENTITY: 422,
    LOCKED: 423,
    FAILED_DEPENDENCY: 424,
    UNORDERED_COLLECTION: 425,
    UPGRADE_REQUIRED: 426,
    PRECONDITION_REQUIRED: 428,
    TOO_MANY_REQUESTS: 429,
    REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIME_OUT: 504,
    HTTP_VERSION_NOT_SUPPORTED: 505,
    VARIANT_ALSO_NEGOTIATES: 506,
    INSUFFICIENT_STORAGE: 507,
    BANDWIDTH_LIMIT_EXCEEDED: 509,
    NOT_EXTENDED: 510,
    NETWORK_AUTHENTICATION_REQUIRED: 511
}

var bitly =  {
        url: "https://api-ssl.bitly.com/v3/user/link_save?",
        user: "naughtyspirit",
        apiKey: "c068748d49c9fa346083e6fcaf343b67b7f8492c"
}

var boltAppId = "54ef44e5fa12501100634591"

var EMAIL_TEMPLATES_PATH = "assets/templates/email/"
var APP_HUNT_EMAIL = "apphunt@naughtyspirit.co"

module.exports.GCM_API_KEY = GCM_API_KEY
module.exports.API_VERSION = API_VERSION
module.exports.STATUS_CODES = STATUS_CODES
module.exports.Android = Android
module.exports.iOS = iOS
module.exports.platforms = platforms
module.exports.appStatuses = appStatuses
module.exports.appStatusesFilter = appStatusesFilter
module.exports.loginTypes = loginTypes
module.exports.bitly = bitly
module.exports.boltAppId = boltAppId
module.exports.EMAIL_TEMPLATES_PATH = EMAIL_TEMPLATES_PATH
module.exports.APP_HUNT_EMAIL = APP_HUNT_EMAIL
