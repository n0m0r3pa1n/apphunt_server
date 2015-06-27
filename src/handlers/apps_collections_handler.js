var _ = require("underscore")
var Boom = require("boom")
var models = require("../models")
var AppsCollection = models.AppsCollection
var User = models.User

var VotesHandler = require('./votes_handler')
var Config = require('../config/config')
var COLLECTION_STATUSES = Config.COLLECTION_STATUSES
var MIN_APPS_LENGTH_FOR_COLLECTION = Config.MIN_APPS_LENGTH_FOR_COLLECTION

import * as PaginationHandler from './stats/pagination_stats_handler.js'
import * as UserHandler from './users_handler.js'

export function* create(appsCollection, userId) {
    var user = yield User.findById(userId).exec()
    appsCollection.createdBy = user
    var collection =  yield AppsCollection.create(appsCollection)
    yield VotesHandler.createAppCollectionVote(collection.id, userId)

    return collection;
}

export function* addApps(collectionId, apps) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }
    collection.apps = _.union( _.map( collection.apps, objToString), _.map( apps, objToString))
    if(collection.apps.length >= MIN_APPS_LENGTH_FOR_COLLECTION) {
        collection.status = COLLECTION_STATUSES.PUBLIC
    }

    yield collection.save()
    return collection
}

function objToString(obj) {
    return obj.toString()
}

export function* favourite(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return Boom.notFound('Collection cannot be found!')
    }
    collection.favouritedBy.push(userId);
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

    let collectionsList = []
    for(let collection of result.collections) {
        let collectionObj = orderAppsInCollection(collection)
        collectionObj.hasVoted = VotesHandler.hasUserVotedForAppsCollection(collection, userId)
        collectionsList.push(collectionObj);
    }

    result.collections = collectionsList
    return result;
}

export function* getFavouriteCollections(userId, page, pageSize) {
    return yield getPagedCollectionsResult({favouritedBy: userId}, {}, page, pageSize)
}

export function* getCollectionsForUser(userId, page, pageSize) {
    return yield getPagedCollectionsResult({createdBy: userId}, {}, page, pageSize)
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
    return Boom.OK();
}

export function* removeCollection(collectionId) {
    var collection = yield AppsCollection.remove({_id: collectionId}).exec()
    return Boom.OK();
}