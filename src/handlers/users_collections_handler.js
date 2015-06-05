var _ = require("underscore")
var models = require("../models")
var UsersCollection = models.UsersCollection
var User = models.User
var App = models.App
var Vote = models.Vote
var Comment = models.Comment

var UserScoreHandler = require('./user_score_handler')

var VotesHandler = require('./votes_handler')
var STATUS_CODES = require('../config/config').STATUS_CODES


function* create(usersCollection, userId) {
    var user = yield User.findById(userId).exec()
    usersCollection.createdBy = user
    return yield UsersCollection.create(usersCollection)
}


function* addUsers(collectionId, usersIds, fromDate, toDate) {
    var collection = yield UsersCollection.findById(collectionId).exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }

    for(var i=0; i<usersIds.length; i++) {
        var userId = usersIds[i];
        if(!isUserAlreadyAdded(collection.usersDetails, userId)) {
            collection.usersDetails.push(yield UserScoreHandler.getUserDetails(userId, fromDate, toDate))
        }
    }
    return yield collection.save()
}

function isUserAlreadyAdded(userDetails, userId) {
    for(var j=0; j<userDetails.length; j++) {
        var currUserId = userDetails[j].user
        if(userId == currUserId) {
            return true;
        }
    }
    return false;
}


function* get(collectionId, userId) {
    var collection = yield UsersCollection.findById(collectionId).populate("createdBy").deepPopulate("usersDetails.user").exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }
    return collection
}

function* getAvailableCollectionsForUser(userId) {
    var availableCollections = yield UsersCollection.find({"usersDetails.user": {$ne: userId}}).exec()
    return availableCollections;
}

function* getCollections(page, pageSize) {
    return yield findPagedCollections({}, page, pageSize)
}

function* findPagedCollections(where, page, pageSize) {
    var query = UsersCollection.find(where).deepPopulate('usersDetails.user').populate("createdBy").populate("usersDetails")

    query.sort({createdAt: 'desc' })
    if(page != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize)
    }

    var collections = yield query.exec()
    var allCollectionsCount = yield UsersCollection.count(where).exec()

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

function* search(q, page, pageSize) {
    var where = {name: {$regex: q, $options: 'i'}}
    var response = yield findPagedCollections(where, page, pageSize)
    var collections = []
    for(var i=0; i<response.collections.length; i++) {
        collections[i] = orderUsersInCollection(response.collections[i])
    }
    response.collections = collections
    return response
}

function orderUsersInCollection(collection) {
    collection = collection.toObject()
    collection.usersDetails.sort(function(u1, u2) {
        return u2.score - u1.score
    })
    return collection
}

module.exports.create = create
module.exports.addUsers = addUsers
module.exports.get = get
module.exports.getCollections = getCollections
module.exports.search = search
module.exports.getAvailableCollectionsForUser = getAvailableCollectionsForUser