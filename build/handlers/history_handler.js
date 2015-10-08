'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.createEvent = createEvent;
exports.postRefreshEvent = postRefreshEvent;
exports.getHistory = getHistory;
exports.getUnseenHistory = getUnseenHistory;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _users_handlerJs = require('./users_handler.js');

var UsersHandler = _interopRequireWildcard(_users_handlerJs);

var _followers_handlerJs = require('./followers_handler.js');

var FollowersHandler = _interopRequireWildcard(_followers_handlerJs);

var _apps_handlerJs = require('./apps_handler.js');

var AppsHandler = _interopRequireWildcard(_apps_handlerJs);

var _apps_collections_handlerJs = require('./apps_collections_handler.js');

var CollectionsHandler = _interopRequireWildcard(_apps_collections_handlerJs);

var _utilsEvent_emitterJs = require('./utils/event_emitter.js');

var _ = require('underscore');

var Boom = require('boom');
var CONFIG = require('../config/config');
var HISTORY_MESSAGES = require('../config/messages').HISTORY_MESSAGES;
var History = require('../models').History;

var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES;
var NOTIFICATIONS_TYPES = CONFIG.NOTIFICATION_TYPES;

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function* createEvent(type, userId) {
    var params = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var historyEvent = yield History.create({ type: type, user: userId, params: params });
    var interestedUsers = [];
    switch (type) {
        case HISTORY_EVENT_TYPES.APP_APPROVED:
            interestedUsers = yield FollowersHandler.getFollowersIds(String(userId));
            interestedUsers.push(userId);
            break;
        case HISTORY_EVENT_TYPES.APP_REJECTED:
            interestedUsers.push(userId);
            break;
        case HISTORY_EVENT_TYPES.APP_FAVOURITED:
            interestedUsers = yield FollowersHandler.getFollowersIds(userId);
            var app = yield AppsHandler.getApp(params.appId);
            if (userId != app.createdBy._id) {
                interestedUsers.push(app.createdBy._id);
            }
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_CREATED:
            interestedUsers = yield FollowersHandler.getFollowersIds(userId);
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED:
            interestedUsers = yield FollowersHandler.getFollowersIds(userId);
            var collection = yield CollectionsHandler.get(params.collectionId);
            if (userId != collection.createdBy._id) {
                interestedUsers.push(collection.createdBy._id);
            }
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_UPDATED:
            interestedUsers = (yield CollectionsHandler.get(params.collectionId)).favouritedBy;
            break;
        case HISTORY_EVENT_TYPES.USER_COMMENT:
            interestedUsers = yield FollowersHandler.getFollowersIds(userId);
            interestedUsers.push((yield AppsHandler.getApp(params.appId)).createdBy._id);
            break;
        case HISTORY_EVENT_TYPES.USER_MENTIONED:
            interestedUsers.push(params.mentionedUserId);
            break;
        case HISTORY_EVENT_TYPES.USER_FOLLOWED:
            interestedUsers.push(params.followingId);
            break;
        case HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS:
            //TODO
            break;
        default:
            return;
    }

    historyEvent = yield History.findOne(historyEvent).populate('user');
    _utilsEvent_emitterJs.EventEmitter.emit('refresh', { interestedUsers: interestedUsers }, historyEvent);
}

function* postRefreshEvent(userId) {
    _utilsEvent_emitterJs.EventEmitter.emit('refresh', { interestedUsers: [userId] });
    return Boom.OK();
}

function* getHistory(userId, date) {
    var toDate = arguments.length <= 2 || arguments[2] === undefined ? new Date(date.getTime() + DAY_MILLISECONDS) : arguments[2];
    return yield* (function* () {
        var user = yield UsersHandler.find(userId);
        if (user == null) {
            return Boom.notFound('User is not existing!');
        }
        var where = {};

        where.createdAt = {
            '$gte': new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
            '$lt': toDate.toISOString()
        };
        where.user = userId;

        where.type = {
            $in: [HISTORY_EVENT_TYPES.APP_APPROVED, HISTORY_EVENT_TYPES.APP_REJECTED]
        };
        var userEvents = yield History.find(where).populate('user').exec();
        var results = [].concat(_toConsumableArray(userEvents));
        results = results.concat((yield getEventsForApps(where.createdAt, userId)));
        results = results.concat((yield getEventsForCollections(where.createdAt, userId)));
        results = results.concat((yield History.find({
            createdAt: where.createdAt,
            type: HISTORY_EVENT_TYPES.USER_MENTIONED,
            'params.mentionedUserId': userId
        }).populate('user').exec()));
        results = results.concat((yield getEventsForFavouriteCollections(where.createdAt, userId)));
        results = results.concat((yield getEventsForFollowings(where.createdAt, userId)));

        results = results.concat((yield History.find({
            createdAt: where.createdAt,
            type: HISTORY_EVENT_TYPES.USER_FOLLOWED,
            'params.followingId': userId
        }).populate('user').exec()));
        var events = yield getPopulatedResponseWithIsFollowing(userId, results);
        events = _.sortBy(events, function (event) {
            return event.createdAt;
        });
        var fromDateStr = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate();
        var toDateStr = toDate.getUTCFullYear() + '-' + (toDate.getUTCMonth() + 1) + '-' + toDate.getUTCDate();
        return { events: events.reverse(), fromDate: fromDateStr, toDate: toDateStr };
    })();
}

function* getUnseenHistory(userId, eventId, dateStr) {
    var tomorrow = new Date(new Date().getTime() + DAY_MILLISECONDS);
    var historyEvents = (yield getHistory(userId, new Date(dateStr), tomorrow)).events;
    var newEventsIds = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = historyEvents[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _event = _step.value;

            if (_event._id == eventId) {
                break;
            }
            newEventsIds.push(_event._id);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return newEventsIds;
}

function* getPopulatedResponseWithIsFollowing(userId, results) {
    var followings = (yield FollowersHandler.getFollowing(userId)).following;
    var followingIds = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = followings[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var following = _step2.value;

            followingIds.push(String(following._id));
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                _iterator2['return']();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    var response = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = results[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var result = _step3.value;

            result = result.toObject();
            result.user.isFollowing = _.contains(followingIds, String(result.user._id));
            result.text = 'Test';
            response.push(result);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                _iterator3['return']();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return response;
}

function getText(type, params) {
    var message = HISTORY_MESSAGES[type];
    var text = '';
    switch (type) {
        case HISTORY_EVENT_TYPES.APP_APPROVED:
            text = String.format(message, params.appName);
            break;
        case HISTORY_EVENT_TYPES.APP_REJECTED:
            text = String.format(message, params.appName);
            break;
        case HISTORY_EVENT_TYPES.APP_FAVOURITED:
            text = String.format(message, params.appName, params.userName);
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_CREATED:
            text = String.format(message, params.userName, params.collectionName);
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED:
            text = String.format(message, params.collectionName, params.userName);
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_UPDATED:
            text = String.format(message, params.collectionName);
            break;
        case HISTORY_EVENT_TYPES.USER_COMMENT:
            text = String.format(message, params.appName, params.userName);
            break;
        case HISTORY_EVENT_TYPES.USER_MENTIONED:
            text = String.format(message, params.appName, params.userName);
            break;
        case HISTORY_EVENT_TYPES.USER_FOLLOWED:
            text = String.format(message, params.userName);
            break;
        case HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS:
            text = String.format(message, params.userName);
            break;
        default:
            return;
    }
}

function* getEventsForApps(createdAt, userId) {
    var results = [];
    var apps = (yield AppsHandler.getAppsForUser(userId)).apps;
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = apps[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var app = _step4.value;

            var appEvents = yield History.find({ createdAt: createdAt, user: { $ne: userId }, 'params.appId': app._id }).populate('user').exec();
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = appEvents[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _event2 = _step5.value;

                    if (_event2.type == HISTORY_EVENT_TYPES.APP_FAVOURITED || _event2.type == HISTORY_EVENT_TYPES.USER_COMMENT) {
                        results.push(_event2);
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5['return']) {
                        _iterator5['return']();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                _iterator4['return']();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    return results;
}

function* getEventsForFollowings(createdAt, userId) {
    var results = [];
    var where = {};
    where.createdAt = createdAt;
    var followings = (yield FollowersHandler.getFollowing(userId)).following;
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = followings[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var following = _step6.value;

            where.user = following.id;
            where.type = {
                $in: [HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS, HISTORY_EVENT_TYPES.COLLECTION_CREATED, HISTORY_EVENT_TYPES.APP_APPROVED, HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED, HISTORY_EVENT_TYPES.APP_FAVOURITED]
            };
            results = results.concat((yield History.find(where).populate('user').exec()));
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                _iterator6['return']();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    return results;
}

function* getEventsForCollections(createdAt, userId) {
    var results = [];
    var collections = (yield CollectionsHandler.getCollections(userId)).collections;
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = collections[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var collection = _step7.value;

            var collectionEvents = yield History.find({
                createdAt: createdAt,
                user: { $ne: userId },
                'params.collectionId': collection._id
            }).populate('user').exec();

            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = collectionEvents[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var _event3 = _step8.value;

                    if (_event3.type == HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED) {
                        results.push(_event3);
                    }
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8['return']) {
                        _iterator8['return']();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }
        }
    } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion7 && _iterator7['return']) {
                _iterator7['return']();
            }
        } finally {
            if (_didIteratorError7) {
                throw _iteratorError7;
            }
        }
    }

    return results;
}

function* getEventsForFavouriteCollections(createdAt, userId) {
    var results = [];
    var collections = (yield CollectionsHandler.getFavouriteCollections(userId)).collections;
    var _iteratorNormalCompletion9 = true;
    var _didIteratorError9 = false;
    var _iteratorError9 = undefined;

    try {
        for (var _iterator9 = collections[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var collection = _step9.value;

            var collectionEvents = yield History.find({ createdAt: createdAt, 'params.collectionId': collection._id }).populate('user').exec();
            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
                for (var _iterator10 = collectionEvents[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                    var _event4 = _step10.value;

                    if (_event4.type == HISTORY_EVENT_TYPES.COLLECTION_UPDATED) {
                        results.push(_event4);
                    }
                }
            } catch (err) {
                _didIteratorError10 = true;
                _iteratorError10 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion10 && _iterator10['return']) {
                        _iterator10['return']();
                    }
                } finally {
                    if (_didIteratorError10) {
                        throw _iteratorError10;
                    }
                }
            }
        }
    } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion9 && _iterator9['return']) {
                _iterator9['return']();
            }
        } finally {
            if (_didIteratorError9) {
                throw _iteratorError9;
            }
        }
    }

    return results;
}