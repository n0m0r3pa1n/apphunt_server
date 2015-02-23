var Mongoose = require('mongoose')
var App = require('../models').App
var User = require('../models').User
var Comment = require('../models').Comment
var Vote = require('../models').Vote
var _ = require("underscore")
var STATUS_CODES = require('../config').STATUS_CODES


function* create(comment, appId, userId, parentId) {
    var app = yield App.findById(appId).exec()
    if (!app) {
        return { statusCode: STATUS_CODES.NOT_FOUND, message: "Non-existing app" }
    }

    var user = yield User.findById(userId).exec()

    var parentComment = null;
    if(parentId !== undefined) {
        parentComment = yield Comment.findById(parentId).exec()
        if(!parentComment) {
            return { statusCode: STATUS_CODES.NOT_FOUND, message: "Non-existing parent comment" }
        }
    }

    comment.app = app
    comment.createdBy = user
    comment.parent = parentComment

    var createdComment = yield Comment.create(comment)
    if(parentComment != null) {
        parentComment.children.push(createdComment)
        parentComment.save()
    }

    return createdComment
}

function* get(appId, userId, page,  pageSize) {

    var resultComments = yield Comment.aggregate([
        {$match: { $and: [
            { app: new Mongoose.Types.ObjectId(appId)},
            { parent: null}
        ]}},
        { $group: { _id: '$_id', votes: {$push:"$votes"}, votesCount: {"$sum": 1}} },
        { $sort: {votesCount: -1, createdAt: -1} },
        { $limit : pageSize },
        { $skip : (page - 1) * pageSize }
    ]).exec()


    //if(userId !== undefined) {
    //    setHasVoted(resultComments, userId)
    //}

    //var allCommentsCount = yield App.count(where).exec()
    //
    //removeVotesField(resultComments)
    //
    //var response = {
    //    comments: resultComments,
    //    totalCount: allCommentsCount,
    //    page: page
    //}
    //if(page != 0 && pageSize != 0) {
    //    response.totalPages = Math.ceil(allCommentsCount / pageSize)
    //}
    return resultComments
}


function addVotesCount(apps) {
    var resultApps = []

    for (var i = 0; i < apps.length; i++) {
        var app = apps[i].toObject()
        app.votesCount = app.votes.length
        resultApps.push(app)
    }
    return resultApps
}

function setHasVoted(comments, userId) {
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i]
        comment.hasVoted = hasVoted(comment, userId)
    }
}

function hasVoted(comment, userId) {
    var hasVoted = false
    for (var j = 0; j < comment.votes.length; j++) {
        if (userId == comment.votes[j].user) {
            hasVoted = true;
            break;
        }
    }
    return hasVoted
}

function removeVotesField(comments) {
    for(var i=0; i<comments.length; i++) {
        delete comments[i].votes
    }
}

module.exports.create = create
module.exports.get = get