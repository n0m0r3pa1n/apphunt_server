var Boom = require('boom')

var Mongoose = require('mongoose')
var Vote = require('../models').Vote
var App = require('../models').App
var Comment = require('../models').Comment
var User = require('../models').User
var AppsCollection = require('../models').AppsCollection
var PLATFORMS = require('../config/config').PLATFORMS
var HISTORY_EVENT_TYPES = require('../config/config').HISTORY_EVENT_TYPES
var APP_STATUSES = require('../config/config').APP_STATUSES
var LOGIN_TYPES = require('../config/config').LOGIN_TYPES

import * as HistoryHandler from './history_handler.js'

// <editor-fold desc="App votes">
function* createAppVote(userId, appId) {
    var user = yield User.findById(userId).exec()

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if (!app) {
        return Boom.notFound('App not found')
    }

    if (app.platform !== PLATFORMS.Android) {
        return Boom.badRequest("You cannot vote apps other than Android and not approved!")
    }

    for (var i = 0; i < app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if (currUserId == userId) {
            return Boom.conflict('Vote exists')
        }
    }
    var vote = new Vote()
    vote.user = user

    vote = yield vote.save()
    app.votes.push(vote)
    app.votesCount = app.votes.length
    yield app.save()

    if (user.loginType != LOGIN_TYPES.Fake) {
        yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_VOTED, user._id, {
            appId: app._id
        })
    }

    return {
        votesCount: app.votesCount
    }
}

function* deleteAppVote(userId, appId) {
    var user = yield User.findById(userId).exec()

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if (!app) {
        return Boom.notFound('App not found')
    }

    var voteToRemoveId = null
    var indexToRemove = 0
    for (var i = 0; i < app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if (currUserId == userId) {
            voteToRemoveId = app.votes[i]._id
            indexToRemove = i
            break;
        }
    }

    app.votes.splice(indexToRemove, 1);
    app.votesCount = app.votes.length
    yield app.save()
    yield Vote.remove({_id: voteToRemoveId}).exec()
    yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_UNVOTED, user._id, {
        appId: app._id
    })
    return {
        votesCount: app.votesCount
    }
}
// </editor-fold>

// <editor-fold desc="Comments">
function* createCommentVote(commentId, userId) {
    return {
        votesCount: 1
    }
}

function* deleteCommentVote(userId, commentId) {
    return {
        votesCount: 1
    }
}
// </editor-fold>

// <editor-fold desc="Votes checks">
function hasUserVotedForComment(comment, userId) {
    return hasUserVotedForUnpopulatedObj(comment, userId)
}

function* setHasUserVotedForCommentField(comments, userId) {
    var resultComments = []
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i]
        if (comment instanceof Comment) {
            comment = comment.toObject()
        }
        comment.hasVoted = hasUserVotedForComment(comment, userId)
        if (comment.children.length > 0) {
            comment.children = yield setHasUserVotedForCommentField(comment.children, userId)
        }

        resultComments.push(comment)
    }
    return resultComments
}

function hasUserVotedForApp(app, userId) {
    return hasUserVotedForPopulatedObj(app, userId);
}

function setHasUserVotedForAppField(apps, userId) {
    var resultApps = []
    for (var i = 0; i < apps.length; i++) {
        var app = apps[i]
        app.hasVoted = hasUserVotedForApp(app, userId)
        resultApps.push(app)
    }
    return resultApps
}

function hasUserVotedForAppsCollection(collection, userId) {
    return hasUserVotedForPopulatedObj(collection, userId)
}

function hasUserVotedForPopulatedObj(obj, userId) {
    if (userId == undefined || userId == null) {
        return false;
    }
    for (var j = 0; j < obj.votes.length; j++) {
        var user = obj.votes[j].user;
        var currentUserId = null
        if(user == null) {
            continue;
        }
        if("_id" in user) {
            currentUserId = user._id
        } else {
            currentUserId = user
        }
        if (user !== null && String(userId) == String(currentUserId)) {
            return true;
        }
    }
    return false
}

function hasUserVotedForUnpopulatedObj(obj, userId) {
    if (!userId) {
        return false;
    }
    for (var j = 0; j < obj.votes.length; j++) {
        var votedUserId = obj.votes[j].user;
        if (String(userId) == String(votedUserId)) {
            return true;
        }
    }
    return false
}

// </editor-fold>


function* clearAppVotes(voteIds, appId) {
    for (var i = 0; i < voteIds; i++) {
        var voteId = voteIds[i]
        var vote = yield Vote.findById(voteId)
        yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_UNVOTED, vote.user, {
            appId: app._id
        })
        yield vote.remove().exec()
    }
}

function* createCollectionVote(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).deepPopulate('votes.user').exec()
    if (!collection) {
        return Boom.notFound('Non-existing collection')
    }

    if (hasUserVotedForPopulatedObj(collection, userId)) {
        return Boom.conflict('Vote exists')
    }

    var user = yield User.findById(userId).exec()
    var vote = new Vote()
    vote.user = user

    vote = yield vote.save()
    collection.votes.push(vote)
    collection.votesCount = collection.votes.length

    yield collection.save()

    return {
        votesCount: collection.votesCount
    }

}

function* deleteCollectionVote(collectionId, userId) {
    var user = yield User.findById(userId).exec()

    var query = AppsCollection.findById(collectionId)
    var collection = yield query.populate("votes").exec()
    if (!collection) {
        return Boom.notFound('Non-existing apps collection')
    }

    var voteToRemoveId = null
    for (var i = 0; i < collection.votes.length; i++) {
        var currUserId = collection.votes[i].user
        if (currUserId == userId) {
            voteToRemoveId = collection.votes[i]
            collection.votes.splice(i, 1);
            collection.votesCount = collection.votes.length
        }
    }

    yield collection.save()
    yield Vote.remove({_id: voteToRemoveId}).exec()
    return {
        votesCount: collection.votesCount
    }
}

function* deleteVotesByIds(votesIds) {
    for (let i = 0; i < votesIds.length; i++) {
        yield Vote.remove({_id: votesIds[i]}).exec()
    }

    return Boom.OK()
}

function* getVotes(fromDate, toDate) {
    var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
    toDate = new Date(toDate.getTime() + DAY_MILLISECONDS);
    let where = {
        createdAt: {
            "$gte": new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
            "$lt": new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
        }
    }

    return yield Vote.find(where).populate('user').exec()
}

module.exports.createAppVote = createAppVote
module.exports.deleteAppVote = deleteAppVote
module.exports.hasUserVotedForApp = hasUserVotedForApp
module.exports.setHasUserVotedForAppField = setHasUserVotedForAppField
module.exports.getVotes = getVotes

module.exports.hasUserVotedForComment = hasUserVotedForComment
module.exports.createCommentVote = createCommentVote
module.exports.deleteCommentVote = deleteCommentVote
module.exports.setHasUserVotedForCommentField = setHasUserVotedForCommentField
module.exports.clearAppVotes = clearAppVotes
module.exports.deleteVotesByIds = deleteVotesByIds

module.exports.createCollectionVote = createCollectionVote
module.exports.deleteCollectionVote = deleteCollectionVote

module.exports.hasUserVotedForAppsCollection = hasUserVotedForAppsCollection