var _ = require("underscore")
var models = require("../models")
var AppsCollection = models.AppsCollection
var User = models.User

var VotesHandler = require('./votes_handler')
var STATUS_CODES = require('../config/config').STATUS_CODES

function* create(appsCollection, userId) {
    var user = yield User.findById(userId).exec()
    appsCollection.createdBy = user
    return yield AppsCollection.create(appsCollection)
}

function* addApps(collectionId, apps) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }
    collection.apps = _.union( _.map( collection.apps, objToString), _.map( apps, objToString))
    return  collection.save()
}

function objToString(obj) {
    return obj.toString()
}

function* get(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).deepPopulate('votes.user apps.createdBy').populate("createdBy").populate("apps").exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }

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
    //TODO: add to each collection field "hasUserVoted"
    return response
}

function* findPagedCollections(where, page, pageSize) {
    var query = AppsCollection.find(where).deepPopulate('votes.user apps.createdBy').populate("createdBy").populate("apps")
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


module.exports.create = create
module.exports.addApps = addApps
module.exports.getCollections = getCollections
module.exports.get = get
module.exports.search = search
