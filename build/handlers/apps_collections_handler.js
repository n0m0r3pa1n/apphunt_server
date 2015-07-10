"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.create = create;
exports.update = update;
exports.favourite = favourite;
exports.unfavourite = unfavourite;
exports.get = get;
exports.getCollections = getCollections;
exports.getFavouriteCollections = getFavouriteCollections;
exports.getCollectionsForUser = getCollectionsForUser;
exports.search = search;
exports.removeApp = removeApp;
exports.removeCollection = removeCollection;
exports.getBanners = getBanners;
exports.createBanner = createBanner;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _statsPagination_stats_handlerJs = require("./stats/pagination_stats_handler.js");

var PaginationHandler = _interopRequireWildcard(_statsPagination_stats_handlerJs);

var _users_handlerJs = require("./users_handler.js");

var UserHandler = _interopRequireWildcard(_users_handlerJs);

var _ = require("underscore");
var Boom = require("boom");
var models = require("../models");
var AppsCollection = models.AppsCollection;
var App = models.App;
var User = models.User;
var CollectionBanner = models.CollectionBanner;

var VotesHandler = require("./votes_handler");
var Config = require("../config/config");
var COLLECTION_STATUSES = Config.COLLECTION_STATUSES;
var MIN_APPS_LENGTH_FOR_COLLECTION = Config.MIN_APPS_LENGTH_FOR_COLLECTION;

function* create(appsCollection, userId) {
    var user = yield User.findById(userId).exec();
    appsCollection.createdBy = user;
    if (appsCollection.picture == undefined || appsCollection.picture == null) {
        var count = yield CollectionBanner.count().exec();
        var rand = Math.floor(Math.random() * count);
        var banner = yield CollectionBanner.findOne().skip(rand).exec();
        appsCollection.picture = banner.url;
    }
    var collection = yield AppsCollection.create(appsCollection);
    yield VotesHandler.createCollectionVote(collection.id, userId);

    return collection;
}

function* update(collectionId, newCollection, userId) {
    var collection = yield AppsCollection.findById(collectionId).populate("createdBy").exec();
    if (!collection) {
        return Boom.notFound("Collection cannot be found!");
    }

    if (!(collection.createdBy.id === userId)) {
        return Boom.methodNotAllowed("Created by is different from user id.");
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = newCollection.apps[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var appId = _step.value;

            var app = yield App.findById(appId).exec();
            if (!app) {
                return Boom.notFound("App not found");
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

    collection.apps = newCollection.apps;
    if (collection.apps.length >= MIN_APPS_LENGTH_FOR_COLLECTION) {
        collection.status = COLLECTION_STATUSES.PUBLIC;
    } else {
        collection.status = COLLECTION_STATUSES.DRAFT;
    }

    collection.name = newCollection.name;
    collection.description = newCollection.description;
    collection.picture = newCollection.picture;

    var savedCollection = yield collection.save();
    var result = yield AppsCollection.findById(savedCollection.id).populate("createdBy apps votes").deepPopulate("apps.createdBy").exec();
    return getPopulatedCollection(result, userId);
}

function objToString(obj) {
    return obj.toString();
}

function* favourite(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec();
    if (!collection) {
        return Boom.notFound("Collection cannot be found!");
    }

    for (var favouritedBy in collection.favouritedBy) {
        if (favouritedBy == userId) {
            return Boom.conflict("User has already voted!");
        }
    }
    collection.favouritedBy.push(userId);
    yield collection.save();

    return Boom.OK();
}

function* unfavourite(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec();
    if (!collection) {
        return Boom.notFound("Collection cannot be found!");
    }
    var size = collection.favouritedBy.length;
    for (var i = 0; i < size; i++) {
        var currentFavouritedId = collection.favouritedBy[i];
        if (currentFavouritedId == userId) {
            collection.favouritedBy.splice(i, 1);
        }
    }

    yield collection.save();

    return Boom.OK();
}

function* get(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).deepPopulate("votes.user apps.createdBy").populate("createdBy").populate("apps").exec();
    if (!collection) {
        return Boom.notFound("Collection cannot be found!");
    }

    collection = orderAppsInCollection(collection);
    //TODO: uncomment when consider votes
    //if(userId !== undefined) {
    //    collection = collection.toObject()
    //    collection.hasVoted = VotesHandler.hasUserVotedForAppsCollection(collection, userId)
    //}

    return collection;
}

function* getCollections(status, userId, sortBy, page, pageSize) {
    var where = status === undefined ? {} : { status: status };
    var sort = sortBy == "vote" ? { votesCount: "desc", updatedAt: "desc" } : { updatedAt: "desc", votesCount: "desc" };
    var result = yield getPagedCollectionsResult(where, sort, page, pageSize);

    if (result.collections !== undefined && result.collections.length > 0) {
        result.collections = getPopulatedCollections(result.collections, userId);
    }

    return result;
}

function isFavourite(collectionObj, userId) {
    if (userId == undefined) {
        return false;
    }

    var userFavouritedBy = collectionObj.favouritedBy;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = userFavouritedBy[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var favouritedId = _step2.value;

            if (favouritedId == userId) {
                return true;
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

    return false;
}

function* getFavouriteCollections(userId, page, pageSize) {
    var result = yield getPagedCollectionsResult({ favouritedBy: userId }, {}, page, pageSize);
    if (result.collections !== undefined && result.collections.length > 0) {
        result.collections = getPopulatedCollections(result.collections, userId);
    }

    return result;
}

function getPopulatedCollections(collections, userId) {
    var collectionsList = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = collections[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var collection = _step3.value;

            var collectionObj = getPopulatedCollection(collection, userId);
            collectionsList.push(collectionObj);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
                _iterator3["return"]();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return collectionsList;
}

function getPopulatedCollection(collection, userId) {
    var collectionObj = orderAppsInCollection(collection);
    collectionObj.hasVoted = VotesHandler.hasUserVotedForAppsCollection(collection, userId);
    collectionObj.isFavourite = isFavourite(collectionObj, userId);
    return collectionObj;
}

function* getCollectionsForUser(userId, page, pageSize) {
    var result = yield getPagedCollectionsResult({ createdBy: userId }, {}, page, pageSize);
    if (result.collections !== undefined && result.collections.length > 0) {
        result.collections = getPopulatedCollections(result.collections, userId);
    }

    return result;
}

function* search(q, page, pageSize, userId) {
    var where = { name: { $regex: q, $options: "i" } };
    var response = yield getPagedCollectionsResult(where, {}, page, pageSize);
    var collections = [];
    for (var i = 0; i < response.collections.length; i++) {
        collections[i] = orderAppsInCollection(response.collections[i]);
    }
    response.collections = collections;
    //TODO: add to each collection field "hasUserVoted"
    return response;
}

function orderAppsInCollection(collection) {
    collection = collection.toObject();
    collection.apps.sort(function (app1, app2) {
        return app2.votesCount - app1.votesCount;
    });
    return collection;
}

function* getPagedCollectionsResult(where, sort, page, pageSize) {
    var query = AppsCollection.find(where).deepPopulate("votes.user apps.createdBy").populate("createdBy").populate("apps");
    query.sort(sort);

    return yield PaginationHandler.getPaginatedResultsWithName(query, "collections", page, pageSize);
}

function* removeApp(collectionId, appId) {
    var collection = yield AppsCollection.findById(collectionId).exec();
    for (var i = 0; i < collection.apps.length; i++) {
        var currAppId = collection.apps[i];
        if (currAppId == appId) {
            collection.apps.splice(i, 1);
        }
    }

    if (collection.apps.length < MIN_APPS_LENGTH_FOR_COLLECTION) {
        collection.status = COLLECTION_STATUSES.DRAFT;
    }

    yield collection.save();
    return Boom.OK();
}

function* removeCollection(collectionId) {
    var collection = yield AppsCollection.remove({ _id: collectionId }).exec();
    return Boom.OK();
}

function* getBanners() {
    var banners = yield CollectionBanner.find({}).select({ "url": 1, "_id": 0 }).exec();
    var result = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = banners[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var banner = _step4.value;

            result.push(banner.url);
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
                _iterator4["return"]();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    return { banners: result };
}

function* createBanner(url) {
    var banner = new CollectionBanner({ url: url });
    yield banner.save();
    return Boom.OK();
}