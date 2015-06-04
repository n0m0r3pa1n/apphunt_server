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

function* getUsersScore(fromDate, toDate) {
    toDate = new Date(toDate.getTime() + DAY_MILLISECONDS)
    var whereDatesRange = {
        createdAt: {
            "$gte": new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
            "$lt": new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
        }
    }

    var comments = yield Comment.find(whereDatesRange).exec()
    var commentsResults = _.countBy(comments, function(comment) {
        return comment.createdBy
    })
    var commentsUserIds = _.keys(commentsResults)



    var votes = yield Vote.find(whereDatesRange).exec()
    var votesResults = _.countBy(votes, function(vote) {
        return vote.user
    })
    var votesUserIds = _.keys(votesResults)

    var apps = yield App.find(whereDatesRange).exec()
    var appsResults = _.countBy(apps, function(app) {
        return app.createdBy
    })
    var appsUserIds = _.keys(appsResults)

    var userIds = _.union(commentsUserIds, votesUserIds, appsUserIds)

    var results = []
    for(var i=0; i<userIds.length; i++) {
        var userId = userIds[i]
        var user = yield User.findById(userId).exec()
        user = user.toObject()
        user.score = 0
        if(_.has(commentsResults, userId)) {
            user.score += commentsResults[userId] * Points.comment
        }
        if(_.has(votesResults, userId)) {
            user.score += votesResults[userId] * Points.vote
        }
        if(_.has(appsResults, userId)) {
            user.score += appsResults[userId] * Points.app
        }
        results.push(user)
    }

    results.sort(function(r1, r2) {
        return r2.score - r1.score
    })

    return results
}

module.exports.getUserDetails = getUserDetails
module.exports.getUsersScore = getUsersScore