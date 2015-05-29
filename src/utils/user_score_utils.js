var _ = require("underscore")
var models = require("../models")
var UsersCollection = models.UsersCollection
var User = models.User
var App = models.App
var Vote = models.Vote
var Comment = models.Comment

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

var Points = {
    vote: 10,
    comment: 50,
    app: 40
}

function* getUserDetails(userId, fromDate, toDate) {

    var userDetails = {
        user: userId,
        addedApps: 0,
        comments: 0,
        votes: 0,
        score: 0
    }

    toDate = new Date(toDate.getTime() + DAY_MILLISECONDS)
    var whereDatesRange = {
        createdAt: {"$gte": new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
            "$lt": new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())}
    }
    userDetails.addedApps = yield App.count(_.extend({createdBy: userId}, whereDatesRange)).exec()
    userDetails.votes = yield Vote.count(_.extend({user: userId}, whereDatesRange)).exec()
    userDetails.comments = yield Comment.count(_.extend({createdBy: userId}, whereDatesRange)).exec()
    userDetails.score = userDetails.votes * Points.vote + userDetails.comments * Points.comment + userDetails.addedApps * Points.app;
    return userDetails
}

module.exports.getUserDetails = getUserDetails