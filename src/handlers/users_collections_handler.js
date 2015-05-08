var _ = require("underscore")
var models = require("../models")
var UsersCollection = models.UsersCollection
var User = models.User

var VotesHandler = require('./votes_handler')
var STATUS_CODES = require('../config/config').STATUS_CODES

function* create(usersCollection, userId) {
    var user = yield User.findById(userId).exec()
    usersCollection.createdBy = user
    return yield UsersCollection.create(usersCollection)
}


function* addUsers(collectionId, users) {
    var collection = yield UsersCollection.findById(collectionId).exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }
    collection.users = _.union( _.map(collection.users, objToString), _.map(users, objToString))
    return  collection.save()
}

function objToString(obj) {
    return obj.toString()
}


function* get(collectionId, userId) {
    var collection = yield UsersCollection.findById(collectionId).populate("createdBy").populate("users").exec()
    if(!collection) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }
    return collection
}

module.exports.create = create
module.exports.addUsers = addUsers
module.exports.get = get