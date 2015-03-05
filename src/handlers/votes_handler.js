var STATUS_CODES = require('../config').STATUS_CODES

var Mongoose = require('mongoose')
var Vote = require('../models').Vote
var App = require('../models').App
var Comment = require('../models').Comment
var User = require('../models').User

// <editor-fold desc="App votes">
function* createAppVote(userId, appId) {
    var user = yield User.findById(userId).exec()

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if(!app) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }

    for(var i=0; i< app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if(currUserId == userId) {
            return {statusCode: STATUS_CODES.CONFLICT}
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

        return {statusCode: STATUS_CODES.NOT_FOUND}
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
        return { statusCode: STATUS_CODES.NOT_FOUND, message: "Non-existing parent comment" }
    }

    for(var i=0; i< comment.votes.length; i++) {
        var currUserId = comment.votes[i].user
        if(currUserId == userId) {
            return {statusCode: STATUS_CODES.CONFLICT}
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
        return {statusCode: STATUS_CODES.NOT_FOUND}
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

module.exports.createAppVote = createAppVote
module.exports.deleteAppVote = deleteAppVote
module.exports.createCommentVote = createCommentVote
module.exports.deleteCommentVote = deleteCommentVote