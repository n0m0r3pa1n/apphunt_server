var _ = require("underscore")
var Boom = require("boom")
var models = require("../models")
var AppsCollection = models.AppsCollection
var App = models.App
var User = models.User
var CollectionBanner = models.CollectionBanner

var VotesHandler = require('./votes_handler')
import * as TagsHandler from '../handlers/tags_handler.js'
import * as HistoryHandler from './history_handler.js'

var CONFIG = require('../config/config')
var COLLECTION_STATUSES = CONFIG.COLLECTION_STATUSES
var MIN_APPS_LENGTH_FOR_COLLECTION = CONFIG.MIN_APPS_LENGTH_FOR_COLLECTION
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES
var HISTORY_MESSAGES = require('../config/messages').HISTORY_MESSAGES

import * as PaginationHandler from './pagination_handler.js'
import * as UserHandler from './users_handler.js'
import * as NotificationsHandler from './notifications_handler.js'
import * as FollowersHandler from './followers_handler.js'

export function* create(appsCollection, tags, userId) {
    var user = yield User.findById(userId).exec()
    appsCollection.createdBy = user
    if(appsCollection.picture == undefined || appsCollection.picture == null) {
        let count = yield CollectionBanner.count().exec()
        let rand = Math.floor(Math.random() * count);
        let banner = yield CollectionBanner.findOne().skip(rand).exec()
        appsCollection.picture = banner.url;
    }
    var collection =  yield AppsCollection.create(appsCollection)
    yield TagsHandler.saveTagsForCollection(tags, collection.id, collection.name)
    yield VotesHandler.createCollectionVote(collection.id, userId)

    return collection;
}

export function* update(collectionId, newCollection, userId) {
    var collection = yield AppsCollection.findById(collectionId).populate('createdBy').exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }

    let user = yield UserHandler.find(userId)
    if(user == null) {
        return Boom.notFound('User cannot be found!')
    }

    if(!(collection.createdBy.id === userId)) {
        return Boom.methodNotAllowed("Created by is different from user id.")
    }

    for(let appId of newCollection.apps) {
        var app = yield App.findById(appId).exec();
        if(!app) {
            return Boom.notFound("App not found")
        }
    }

    collection.apps = newCollection.apps
    if(collection.apps.length >= MIN_APPS_LENGTH_FOR_COLLECTION) {
        if(collection.status == COLLECTION_STATUSES.DRAFT) {
            yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.COLLECTION_CREATED, userId, {collectionId: collection._id,
                collectionName: newCollection.name, userName: user.name})
        } else {
            yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.COLLECTION_UPDATED, userId, {collectionId: collection._id,
                collectionName: newCollection.name})
        }
        collection.status = COLLECTION_STATUSES.PUBLIC
    } else {
        collection.status = COLLECTION_STATUSES.DRAFT
        collection.favouritedBy = []
    }

    collection.name = newCollection.name
    collection.description = newCollection.description
    collection.picture = newCollection.picture

    let savedCollection = yield collection.save()
    let result = yield AppsCollection.findById(savedCollection.id)
        .populate('createdBy apps votes').deepPopulate('apps.createdBy apps.categories').exec()

    return yield getPopulatedCollection(result, userId)
}

function objToString(obj) {
    return obj.toString()
}

export function* favourite(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }

    let user = yield User.findById(userId)
    if(user == null) {
        return Boom.notFound('User cannot be found!')
    }

    for(let favouritedBy in collection.favouritedBy) {
        if(favouritedBy == userId) {
            return Boom.conflict("User has already favourited collection!");
        }
    }
    collection.favouritedBy.push(userId);
    yield collection.save()

    yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED, userId, {collectionId: collection._id,
        collectionName: collection.name, userName: user.name})
    let isFollowing = yield FollowersHandler.isFollowing(collection.createdBy, userId)
    if(isFollowing) {
        let title = "Check this awesome collection"
        let message = HistoryHandler.getText(HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED, {collectionName: collection.name, userName: user.name})
        yield NotificationsHandler.sendNotificationsToUsers([collection.createdBy], title, message,
            user.profilePicture, NOTIFICATION_TYPES.FOLLOWING_FAVOURITED_COLLECTION, {
            collectionId: collectionId
        })
    }

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
    var collection = yield AppsCollection.findById(collectionId)
        .deepPopulate('votes.user apps.createdBy apps.categories')
        .populate("createdBy").populate("apps").exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }

    return yield getPopulatedCollection(collection, userId)
}

function getCategoriesForApp(app) {
    let categories = []
    for(let category of app.categories) {
        categories.push(category.name)
    }

    return categories
}

export function* searchCollections(status, userId, sortBy, page, pageSize) {
    var where = status === undefined ? {} : {status: status}
    var sort = sortBy == "vote" ?
        {votesCount: 'desc', updatedAt: 'desc'} :
        {updatedAt: 'desc', votesCount: 'desc'}
    let result = yield getPagedCollectionsResult(where, sort, page, pageSize)

    if(result.collections !== undefined && result.collections.length > 0) {
        result.collections = yield getPopulatedCollections(result.collections, userId);
    }

    return result;
}

export function* getAvailableCollections(userId, appId, status, page, pageSize) {
    var where = status === undefined ? {} : {status: status}
    where.createdBy = {$eq: userId }
    where.apps = {$ne: appId}
    let result = yield getPagedCollectionsResult(where, {}, page, pageSize)
    if(result.collections !== undefined && result.collections.length > 0) {
        result.collections = yield getPopulatedCollections(result.collections, userId);
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

export function* getFavouriteCollections(favouritedBy, userId = favouritedBy, page = 0, pageSize = 0) {
    let result = yield getPagedCollectionsResult({favouritedBy: favouritedBy}, {}, page, pageSize)
    if(result.collections !== undefined && result.collections.length > 0) {
        result.collections = yield getPopulatedCollections(result.collections, userId);
    }

    return result
}

function* getPopulatedCollections(collections, userId) {
    let collectionsList = []
    for (let collection of collections) {
        let collectionObj = yield getPopulatedCollection(collection, userId)
        collectionsList.push(collectionObj);
    }

    return collectionsList
}

function* getPopulatedCollection(collection, userId) {
    let collectionObj = orderAppsInCollection(collection)
    collectionObj.hasVoted = VotesHandler.hasUserVotedForAppsCollection(collection, userId)
    collectionObj.isFavourite = isFavourite(collectionObj, userId)
    collectionObj.tags = yield TagsHandler.getTagsForCollection(collectionObj._id)
    for(let app of collectionObj.apps) {
        app.categories = getCategoriesForApp(app)
    }
    return collectionObj;
}

export function* getCollections(creatorId, userId = creatorId, page = 0, pageSize = 0) {
    let where = {}
    where.createdBy = creatorId
    if(String(creatorId) != String(userId)) {
        where.status = COLLECTION_STATUSES.PUBLIC
    }
    let result = yield getPagedCollectionsResult(where, {}, page, pageSize)
    if(result.collections !== undefined && result.collections.length > 0) {
        result.collections = yield getPopulatedCollections(result.collections, userId);
    }

    return result;
}

export function* getCollectionsCount(userId) {
    return yield AppsCollection.count({favouritedBy: userId}).exec()
}

export function* search(q, page, pageSize, userId) {
    var where = {name: {$regex: q, $options: 'i'}}
    var response = yield getPagedCollectionsResult(where, {}, page, pageSize)
    var collections = []
    for(var i=0; i<response.collections.length; i++) {
        let collection = orderAppsInCollection(response.collections[i])
        for(let app of collection.apps) {
            let categories = []
            for (let category of app.categories) {
                categories.push(category.name)
            }
            app.categories = categories
        }
        collections[i] = collection

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
        .deepPopulate('votes.user apps.createdBy apps.categories')
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