var _ = require("underscore")
var Boom = require("boom")
var models = require("../models")
var AppsCollection = models.AppsCollection
var App = models.App
var User = models.User
var CollectionBanner = models.CollectionBanner

var VotesHandler = require('./votes_handler')
var Config = require('../config/config')
var COLLECTION_STATUSES = Config.COLLECTION_STATUSES
var MIN_APPS_LENGTH_FOR_COLLECTION = Config.MIN_APPS_LENGTH_FOR_COLLECTION

import * as PaginationHandler from './stats/pagination_stats_handler.js'
import * as UserHandler from './users_handler.js'

export function* create(appsCollection, userId) {
    var user = yield User.findById(userId).exec()
    appsCollection.createdBy = user
    if(appsCollection.picture == undefined || appsCollection.picture == null) {
        let count = yield CollectionBanner.count().exec()
        let rand = Math.floor(Math.random() * count);
        let banner = yield CollectionBanner.findOne().skip(rand).exec()
        appsCollection.picture = banner.url;
    }
    var collection =  yield AppsCollection.create(appsCollection)
    yield VotesHandler.createCollectionVote(collection.id, userId)

    return collection;
}

export function* update(collectionId, newCollection) {
    var collection = yield AppsCollection.findById(collectionId).populate("createdBy").exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }

    for(let appId of newCollection.apps) {
        var app = yield App.findById(appId).exec();
        if(!app) {
            return Boom.notFound("App not found")
        }
    }

    collection.apps = newCollection.apps
    if(collection.apps.length >= MIN_APPS_LENGTH_FOR_COLLECTION) {
        collection.status = COLLECTION_STATUSES.PUBLIC
    } else {
        collection.status = COLLECTION_STATUSES.DRAFT
    }

    collection.name = newCollection.name
    collection.description = newCollection.description
    collection.picture = newCollection.picture

    return yield collection.save()
}

function objToString(obj) {
    return obj.toString()
}

export function* favourite(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }

    for(let favouritedBy in collection.favouritedBy) {
        if(favouritedBy == userId) {
            return Boom.conflict("User has already voted!");
        }
    }
    collection.favouritedBy.push(userId);
    yield collection.save()

    return Boom.OK();
}

export function* unfavourite(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }
    var size = collection.favouritedBy.length;
    for(let i=0; i < size; i++) {
        let currentFavouritedId = collection.favouritedBy[i]
        if(currentFavouritedId == userId) {
            collection.favouritedBy.splice(i, 1);
        }
    }

    yield collection.save()

    return Boom.OK();
}

export function* get(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).deepPopulate('votes.user apps.createdBy').populate("createdBy").populate("apps").exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }

    collection = orderAppsInCollection(collection)
    //TODO: uncomment when consider votes
    //if(userId !== undefined) {
    //    collection = collection.toObject()
    //    collection.hasVoted = VotesHandler.hasUserVotedForAppsCollection(collection, userId)
    //}

    return collection
}

export function* getCollections(status, userId, sortBy, page, pageSize) {
    var where = status === undefined ? {} : {status: status}
    var sort = sortBy == "vote" ? {votesCount: 'desc', updatedAt: 'desc'} : {updatedAt: 'desc', votesCount: 'desc'}
    let result = yield getPagedCollectionsResult(where, sort, page, pageSize)

    if(result.collections !== undefined && result.collections.length > 0) {
        result.collections = getPopulatedCollections(result.collections, userId);
    }

    return result;
}

function isFavourite(collectionObj, userId) {
    if(userId == undefined) {
        return false;
    }

    let userFavouritedBy = collectionObj.favouritedBy
    for(let favouritedId of userFavouritedBy) {
        if(favouritedId == userId) {
            return true
        }
    }
    return false
}

export function* getFavouriteCollections(userId, page, pageSize) {
    let result = yield getPagedCollectionsResult({favouritedBy: userId}, {}, page, pageSize)
    if(result.collections !== undefined && result.collections.length > 0) {
        result.collections = getPopulatedCollections(result.collections, userId);
    }

    return result
}

function getPopulatedCollections(collections, userId) {
    let collectionsList = []
    for (let collection of collections) {
        let collectionObj = orderAppsInCollection(collection)
        collectionObj.hasVoted = VotesHandler.hasUserVotedForAppsCollection(collection, userId)
        collectionObj.isFavourite = isFavourite(collectionObj, userId)
        collectionsList.push(collectionObj);
    }

    return collectionsList
}

export function* getCollectionsForUser(userId, page, pageSize) {
    let result = yield getPagedCollectionsResult({createdBy: userId}, {}, page, pageSize)
    if(result.collections !== undefined && result.collections.length > 0) {
        result.collections = getPopulatedCollections(result.collections, userId);
    }

    return result;
}

export function* search(q, page, pageSize, userId) {
    var where = {name: {$regex: q, $options: 'i'}}
    var response = yield getPagedCollectionsResult(where, {}, page, pageSize)
    var collections = []
    for(var i=0; i<response.collections.length; i++) {
        collections[i] = orderAppsInCollection(response.collections[i])
    }
    response.collections = collections
    //TODO: add to each collection field "hasUserVoted"
    return response
}

function orderAppsInCollection(collection) {
    collection = collection.toObject()
    collection.apps.sort(function(app1, app2) {
        return app2.votesCount - app1.votesCount
    })
    return collection
}

function* getPagedCollectionsResult(where, sort, page, pageSize) {
    var query = AppsCollection.find(where)
        .deepPopulate('votes.user apps.createdBy')
        .populate("createdBy")
        .populate("apps")
    query.sort(sort)

    return yield PaginationHandler.getPaginatedResultsWithName(query, "collections", page, pageSize)
}

export function* removeApp(collectionId, appId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    for(var i=0; i< collection.apps.length; i++) {
        var currAppId = collection.apps[i]
        if(currAppId == appId) {
            collection.apps.splice(i, 1);
        }
    }

    if(collection.apps.length < MIN_APPS_LENGTH_FOR_COLLECTION) {
        collection.status = COLLECTION_STATUSES.DRAFT
    }

    yield collection.save()
    return Boom.OK()
}

export function* removeCollection(collectionId) {
    var collection = yield AppsCollection.remove({_id: collectionId}).exec()
    return Boom.OK()
}

export function* getBanners() {
    let banners = yield CollectionBanner.find({}).select({ "url": 1, "_id": 0}).exec()
    let result = []
    for (let banner of banners) {
        result.push(banner.url)
    }

    return {banners: result};
}

export function* createBanner(url) {
    var banner = new CollectionBanner({url: url})
    yield banner.save()
    return Boom.OK()
}