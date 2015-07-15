var _ = require("underscore")
var Boom = require('boom')
var models = require("../models")
var UsersCollection = models.UsersCollection
var User = models.User
var App = models.App
var Vote = models.Vote
var Comment = models.Comment

var UserScoreHandler = require('./user_score_handler')
var VotesHandler = require('./votes_handler')
import * as PaginationHandler from './stats/pagination_stats_handler.js'

function* create(usersCollection, userId) {
    var user = yield User.findById(userId).exec()
    usersCollection.createdBy = user
    return yield UsersCollection.create(usersCollection)
}


function* addUsers(collectionId, usersIds, fromDate, toDate) {
    var collection = yield UsersCollection.findById(collectionId).exec()
    if(!collection) {
        return Boom.notFound("Non-existing collection")
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
        return Boom.notFound("Non-existing collection")
    }
    collection = orderUsersInCollection(collection)
    return collection
}

function* getAvailableCollectionsForUser(userId) {
    return yield UsersCollection.find({"usersDetails.user": {$ne: userId}}).exec();
}

function* getCollections(page, pageSize) {
    return yield findPagedCollections({}, page, pageSize)
}

function* findPagedCollections(where, page, pageSize) {
    var query = UsersCollection.find(where).deepPopulate('usersDetails.user').populate("createdBy").populate("usersDetails")
    query.sort({createdAt: 'desc' })

    return yield PaginationHandler.getPaginatedResultsWithName(query, "collections", page, pageSize)
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

function* removeUser(collectionId, userDetailsId) {
    var collection = yield UsersCollection.findById(collectionId).exec()
    for(var i=0; i< collection.usersDetails.length; i++) {
        var currUserDetailsId = collection.usersDetails[i]._id.toString()
        if(currUserDetailsId == userDetailsId) {
            collection.usersDetails.splice(i, 1);
        }
    }

    yield collection.save()
    return Boom.OK()
}

function* remove(collectionId) {
    yield UsersCollection.remove({_id: collectionId}).exec()
    return Boom.OK()
}

module.exports.create = create
module.exports.addUsers = addUsers
module.exports.get = get
module.exports.getCollections = getCollections
module.exports.search = search
module.exports.getAvailableCollectionsForUser = getAvailableCollectionsForUser
module.exports.removeUser = removeUser
module.exports.remove = remove