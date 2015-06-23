var _ = require("underscore")
var models = require("../models")
var AppsCollection = models.AppsCollection
var User = models.User

var VotesHandler = require('./votes_handler')
var UserHandler = require('./users_handler')
var Config = require('../config/config')
var STATUS_CODES = Config.STATUS_CODES
var COLLECTION_STATUSES = Config.COLLECTION_STATUSES
var MIN_APPS_LENGTH_FOR_COLLECTION = Config.MIN_APPS_LENGTH_FOR_COLLECTION

function* create(appsCollection, userId) {
    var user = yield User.findById(userId).exec()
    appsCollection.createdBy = user
    var collection =  yield AppsCollection.create(appsCollection)
    yield VotesHandler.createAppCollectionVote(collection.id, userId)

    return collection;
}

function* addApps(collectionId, apps) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
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

function* favourite(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }
    collection.favouritedBy.push(userId);
    yield collection.save()

    return {statusCode: STATUS_CODES.OK}
}

function* get(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).deepPopulate('votes.user apps.createdBy').populate("createdBy").populate("apps").exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }

    collection = orderAppsInCollection(collection)
    //TODO: uncomment when consider votes
    //if(userId !== undefined) {
    //    collection = collection.toObject()
    //    collection.hasVoted = VotesHandler.hasUserVotedForAppsCollection(collection, userId)
    //}

    return collection
}

function* getCollections(page, pageSize) {
    return yield findPagedCollections({}, page, pageSize)
}


function* search(q, page, pageSize, userId) {
    var where = {name: {$regex: q, $options: 'i'}}
    var response = yield findPagedCollections(where, page, pageSize)
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

function* findPagedCollections(where, page, pageSize) {
    var query = AppsCollection.find(where)
        .deepPopulate('votes.user apps.createdBy')
        .populate("createdBy")
        .populate("apps")
    query.sort({createdAt: 'desc' })

    if(page != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize)
    }

    var collections = yield query.exec()

    var allCollectionsCount = yield AppsCollection.count(where).exec()

    var response = {
        collections: collections,
        totalCount: allCollectionsCount,
        page: page
    }

    if(page != 0 && pageSize != 0 && allCollectionsCount > 0) {
        response.totalPages = Math.ceil(allCollectionsCount / pageSize)
    }
    return response
}

function* removeApp(collectionId, appId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    for(var i=0; i< collection.apps.length; i++) {
        var currAppId = collection.apps[i]
        if(currAppId == appId) {
            collection.apps.splice(i, 1);
        }
    }

    yield collection.save()
    return {statusCode: STATUS_CODES.OK}
}

function* removeCollection(collectionId) {
    var collection = yield AppsCollection.remove({_id: collectionId}).exec()
    return {statusCode: STATUS_CODES.OK}
}

module.exports.create = create
module.exports.addApps = addApps
module.exports.getCollections = getCollections
module.exports.get = get
module.exports.favourite = favourite
module.exports.search = search
module.exports.removeApp = removeApp
module.exports.removeCollection = removeCollection
