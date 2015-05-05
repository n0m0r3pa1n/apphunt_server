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
    collection.apps = _.union( _.map( collection.apps, objToString), _.map( apps, objToString))
    return  collection.save()
}

function objToString(obj) {
    return obj.toString()
}

function* getCollection(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
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

module.exports.create = create
module.exports.addApps = addApps
module.exports.getCollection = getCollection
