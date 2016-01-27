"use strict";

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _pagination_handlerJs = require("./pagination_handler.js");

var PaginationHandler = _interopRequireWildcard(_pagination_handlerJs);

var _history_handlerJs = require("./history_handler.js");

var HistoryHandler = _interopRequireWildcard(_history_handlerJs);

var _users_handlerJs = require("./users_handler.js");

var UsersHandler = _interopRequireWildcard(_users_handlerJs);

var _ = require("underscore");
var Boom = require("boom");
var models = require("../models");
var NodeCache = require("node-cache");
var myCache = new NodeCache();

var LOGIN_TYPES = require("../config/config").LOGIN_TYPES;

var UsersCollection = models.UsersCollection;
var User = models.User;
var App = models.App;
var Vote = models.Vote;
var Comment = models.Comment;

var HISTORY_EVENT_TYPES = require("../config/config").HISTORY_EVENT_TYPES;

var UserScoreHandler = require("./user_score_handler");
var VotesHandler = require("./votes_handler");

function* create(usersCollection, userId) {
    usersCollection.createdBy = yield User.findById(userId).exec();
    return yield UsersCollection.create(usersCollection);
}

function* addUsers(collectionId, usersIds, fromDate, toDate) {
    var collection = yield UsersCollection.findById(collectionId).exec();
    if (!collection) {
        return Boom.notFound("Non-existing collection");
    }

    for (var i = 0; i < usersIds.length; i++) {
        var userId = usersIds[i];
        if (!isUserAlreadyAdded(collection.usersDetails, userId)) {
            var user = yield UsersHandler.find(userId);
            if (user == null) {
                console.log("User cannot be found!");
                continue;
            }

            var result = yield UserScoreHandler.getUserDetails(userId, fromDate, toDate);
            collection.usersDetails.push(result);
            yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS, userId, { collectionId: collectionId, userName: user.name });
        }
    }
    return yield collection.save();
}

function isUserAlreadyAdded(userDetails, userId) {
    for (var j = 0; j < userDetails.length; j++) {
        var currUserId = userDetails[j].user;
        if (userId == currUserId) {
            return true;
        }
    }
    return false;
}

function* get(collectionId, userId) {
    var collection = yield UsersCollection.findById(collectionId).populate("createdBy").deepPopulate("usersDetails.user").exec();
    if (!collection) {
        return Boom.notFound("Non-existing collection");
    }
    collection = orderUsersInCollection(collection);
    return collection;
}

function* getAvailableCollectionsForUser(userId) {
    return yield UsersCollection.find({ "usersDetails.user": { $ne: userId } }).exec();
}

function* getCollections(page, pageSize) {
    return yield findPagedCollections({}, page, pageSize);
}

function* findPagedCollections(where, page, pageSize) {
    var query = UsersCollection.find(where).deepPopulate("usersDetails.user").populate("createdBy").populate("usersDetails");
    query.sort({ createdAt: "desc" });

    return yield PaginationHandler.getPaginatedResultsWithName(query, "collections", page, pageSize);
}

function* search(q, page, pageSize) {
    var where = { name: { $regex: q, $options: "i" } };
    var response = yield findPagedCollections(where, page, pageSize);
    var collections = [];
    for (var i = 0; i < response.collections.length; i++) {
        collections[i] = orderUsersInCollection(response.collections[i]);
    }
    response.collections = collections;
    return response;
}

function* getTopHuntersList() {
    var usersSet = new Set();
    var collections = yield UsersCollection.find({}).deepPopulate("usersDetails.user").exec();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = collections[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var collection = _step.value;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = collection.usersDetails[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var detail = _step2.value;

                    if (!usersSet.has(detail.user)) {
                        usersSet.add(detail.user);
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                        _iterator2["return"]();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator["return"]) {
                _iterator["return"]();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return { users: Array.from(usersSet) };
}

function* getTopHuntersCollectionForCurrentMonth() {
    var keyTopHunters = "topHunters";
    var response = myCache.get(keyTopHunters);
    if (response != undefined) {
        console.log("response from cache");
        return response;
    }

    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var toDate = new Date();

    var allScores = yield UserScoreHandler.getUsersScore(firstDay, toDate);
    var realUsersScore = [];
    allScores.map(function (userScore) {
        if (userScore.loginType != LOGIN_TYPES.Fake && userScore.loginType != LOGIN_TYPES.Anonymous) {
            if (realUsersScore.length < 10) {
                var collections = userScore.collections;
                var votes = userScore.votes;
                var apps = userScore.apps;
                var score = userScore.score;
                var comments = userScore.comments;

                delete userScore["comments"];
                delete userScore["score"];
                delete userScore["apps"];
                delete userScore["votes"];
                delete userScore["collections"];

                realUsersScore.push({
                    comments: comments,
                    addedApps: apps,
                    votes: votes,
                    collections: collections,
                    score: score,
                    user: userScore
                });
            }
        }
    });

    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var collection = {
        name: "Top Hunters for " + monthNames[date.getMonth()],
        description: "Top Hunters for " + monthNames[date.getMonth()],
        usersDetails: realUsersScore
    };

    response = {
        collections: [collection]
    };

    var twoHours = 7200;
    myCache.set(keyTopHunters, response, twoHours, function (err, success) {
        if (err) {
            console.log(err);
        }
    });
    return response;
}

function orderUsersInCollection(collection) {
    collection = collection.toObject();
    collection.usersDetails.sort(function (u1, u2) {
        return u2.score - u1.score;
    });
    return collection;
}

function* removeUser(collectionId, userDetailsId) {
    var collection = yield UsersCollection.findById(collectionId).exec();
    for (var i = 0; i < collection.usersDetails.length; i++) {
        var currUserDetailsId = collection.usersDetails[i]._id.toString();
        if (currUserDetailsId == userDetailsId) {
            collection.usersDetails.splice(i, 1);
        }
    }

    yield collection.save();
    return Boom.OK();
}

function* remove(collectionId) {
    yield UsersCollection.remove({ _id: collectionId }).exec();
    return Boom.OK();
}

module.exports.create = create;
module.exports.addUsers = addUsers;
module.exports.get = get;
module.exports.getCollections = getCollections;
module.exports.search = search;
module.exports.getAvailableCollectionsForUser = getAvailableCollectionsForUser;
module.exports.removeUser = removeUser;
module.exports.remove = remove;
module.exports.getTopHuntersCollectionForCurrentMonth = getTopHuntersCollectionForCurrentMonth;
module.exports.getTopHuntersList = getTopHuntersList;