'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getAd = getAd;
exports.createAd = createAd;
exports.shouldShowAd = shouldShowAd;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _history_handlerJs = require('./history_handler.js');

var HistoryHandler = _interopRequireWildcard(_history_handlerJs);

var _ = require('underscore');
var Boom = require('boom');

var Ad = require('../models').Ad;

var HISTORY_EVENT_TYPES = require('../config/config').HISTORY_EVENT_TYPES;

var MIN_SUBMTTED_APPS = 1;
var MIN_COMMENTS_COUNT = 3;
var MIN_COLLECTIONS_CREATED = 1;

function* getAd() {
    var ads = yield Ad.find({}).exec();
    if (ads.length == 0) {
        return {};
    }
    var index = Math.floor(Math.random() * ads.length);
    return ads[index];
}

function* createAd(_ref) {
    var name = _ref.name;
    var picture = _ref.picture;
    var link = _ref.link;

    var ad = new Ad({
        name: name,
        picture: picture,
        link: link
    });

    yield ad.save();

    return Boom.OK();
}

function* shouldShowAd(userId) {
    var adLoadNumber = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    if (adLoadNumber % 3 != 0) {
        return { shouldShowAd: false };
    }

    var historyEventTypes = [HISTORY_EVENT_TYPES.APP_SUBMITTED, HISTORY_EVENT_TYPES.USER_COMMENT, HISTORY_EVENT_TYPES.COLLECTION_CREATED];

    var recentUserHistory = yield HistoryHandler.getRecentUserActions(userId, historyEventTypes, new Date());
    if (recentUserHistory.events.length == 0) {
        return { shouldShowAd: true };
    }

    var appsSubmitted = 0,
        comments = 0,
        collections = 0;
    recentUserHistory.events.map(function (item) {
        if (item.type == HISTORY_EVENT_TYPES.APP_SUBMITTED) {
            appsSubmitted++;
        } else if (item.type == HISTORY_EVENT_TYPES.USER_COMMENT) {
            comments++;
        } else if (item.type == HISTORY_EVENT_TYPES.COLLECTION_CREATED) {
            collections++;
        }
    });

    if (appsSubmitted >= MIN_SUBMTTED_APPS || comments >= MIN_COMMENTS_COUNT || collections >= MIN_COLLECTIONS_CREATED) {
        return { shouldShowAd: false };
    }

    return { shouldShowAd: true };
}