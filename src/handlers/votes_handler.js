var Boom = require('boom')

var Mongoose = require('mongoose')
var Vote = require('../models').Vote
var App = require('../models').App
var Comment = require('../models').Comment
var User = require('../models').User
var AppsCollection = require('../models').AppsCollection

// <editor-fold desc="App votes">
function* createAppVote(userId, appId) {
    var user = yield User.findById(userId).exec()

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if(!app) {
        return Boom.notFound('App not found')
    }

    for(var i=0; i< app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if(currUserId == userId) {
            return Boom.conflict('Vote exists')
        }
    }
    var vote = new Vote()
    vote.user = user

    vote = yield vote.save()
    app.votes.push(vote)
    app.votesCount = app.votes.length
    yield app.save()

    return {
        votesCount: app.votesCount
    }
}

function* deleteAppVote(userId, appId) {
    var user = yield User.findById(userId).exec()

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if(!app) {
        return Boom.notFound('App not found')
    }
    for(var i=0; i< app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if(currUserId == userId) {
            app.votes.splice(i, 1);
        }
    }
    app.votesCount = app.votes.length
    yield app.save()
    return {
        votesCount: app.votesCount
    }
}
// </editor-fold>

// <editor-fold desc="Comments">
function* createCommentVote(commentId, userId) {
    var comment = yield Comment.findById(commentId).populate('votes').exec()
    if(!comment) {
        return Boom.notFound('Non-existing parent comment')
    }

    for(var i=0; i< comment.votes.length; i++) {
        var currUserId = comment.votes[i].user
        if(currUserId == userId) {
            return Boom.conflict('Vote exists')
        }
    }

    var user = yield User.findById(userId).exec()
    var vote = new Vote()
    vote.user = user

    vote = yield vote.save()
    comment.votes.push(vote)
    comment.votesCount = comment.votes.length

    yield comment.save()

    return {
        votesCount: comment.votesCount
    }
}

function* deleteCommentVote(userId, commentId) {
    var user = yield User.findById(userId).exec()

    var query = Comment.findById(commentId)
    var comment = yield query.populate("votes").exec()
    if(!comment) {
        return Boom.notFound('Non-existing comment')
    }

    for(var i=0; i< comment.votes.length; i++) {
        var currUserId = comment.votes[i].user
        if(currUserId == userId) {
            comment.votes.splice(i, 1);
            comment.votesCount = comment.votes.length
        }
    }

    yield comment.save()
    return {
        votesCount: comment.votesCount
    }
}
// </editor-fold>

// <editor-fold desc="Votes checks">
function hasUserVotedForComment (comment, userId) {
    return hasUserVotedForUnpopulatedObj(comment, userId)
}

function* setHasUserVotedForCommentField(comments, userId) {
    var resultComments = []
    for(var i =0; i< comments.length; i++) {
        var comment = comments[i]
        if(comment instanceof Comment) {
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
    for (var j = 0; j < obj.votes.length; j++) {
        var user = obj.votes[j].user;
        if (user !== null && userId == user._id) {
            return true;
        }
    }
    return false
}

function hasUserVotedForUnpopulatedObj(obj, userId) {
    if(!userId) {
        return false;
    }
    for (var j = 0; j < obj.votes.length; j++) {
        var votedUserId = obj.votes[j].user;
        if (userId == votedUserId) {
            return true;
        }
    }
    return false
}

// </editor-fold>


function* clearAppVotes(voteIds) {
    for(var i =0; i< voteIds; i++) {
        var voteId = voteIds[i]
        yield Vote.remove({_id: voteId}).exec()
    }
}

function* createAppCollectionVote(collectionId, userId) {
    var collection = yield AppsCollection.findById(collectionId).exec()
    if(!collection) {
        return Boom.notFound('Non-existing collection')
    }

    if(hasUserVotedForUnpopulatedObj(collection, userId)) {
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

function* deleteAppCollectionVote(collectionId, userId) {
    var user = yield User.findById(userId).exec()

    var query = AppsCollection.findById(collectionId)
    var collection = yield query.populate("votes").exec()
    if(!collection) {
        return Boom.notFound('Non-existing apps collection')
    }

    for(var i=0; i< collection.votes.length; i++) {
        var currUserId = collection.votes[i].user
        if(currUserId == userId) {
            collection.votes.splice(i, 1);
            collection.votesCount = collection.votes.length
        }
    }

    yield collection.save()
    return {
        votesCount: collection.votesCount
    }
}

module.exports.createAppVote = createAppVote
module.exports.deleteAppVote = deleteAppVote
module.exports.hasUserVotedForApp = hasUserVotedForApp
module.exports.setHasUserVotedForAppField = setHasUserVotedForAppField

module.exports.hasUserVotedForComment = hasUserVotedForComment
module.exports.createCommentVote = createCommentVote
module.exports.deleteCommentVote = deleteCommentVote
module.exports.setHasUserVotedForCommentField = setHasUserVotedForCommentField
module.exports.clearAppVotes = clearAppVotes

module.exports.createAppCollectionVote = createAppCollectionVote
module.exports.deleteAppCollectionVote = deleteAppCollectionVote

module.exports.hasUserVotedForAppsCollection = hasUserVotedForAppsCollection