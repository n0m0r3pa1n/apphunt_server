var _ = require("underscore")

var STATUS_CODES = require('../config').STATUS_CODES

var Mongoose = require('mongoose')
var App = require('../models').App
var User = require('../models').User
var Comment = require('../models').Comment
var Vote = require('../models').Vote

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
    var where = {app: appId, parent: null}
    var query = Comment.find(where).deepPopulate("children.createdBy children.votes").populate('votes').populate("createdBy")
    query.sort({ votesCount: 'desc', createdAt: 'desc' })

    if(page != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize)
    }

    var resultComments = yield query.exec()
    if(userId !== undefined) {
        resultComments = yield setHasVoted(resultComments, userId)
    }

    var allCommentsCount = yield Comment.count(where).exec()

    removeVotesField(resultComments)

    var response = {
        comments: resultComments,
        totalCount: allCommentsCount,
        page: page
    }
    if(page != 0 && pageSize != 0) {
        response.totalPages = Math.ceil(allCommentsCount / pageSize)
    }
    return response
}

function* setHasVoted(comments, userId) {
    var resultComments = []
    for(var i =0; i< comments.length; i++) {
        var comment = comments[i]
        if(comment instanceof Comment) {
            comment = comment.toObject()
        }
        comment.hasVoted = hasVoted(comment, userId)
        if (comment.children.length > 0) {
            comment.children = yield setHasVoted(comment.children, userId)
        }

        resultComments.push(comment)
    }
    return resultComments
}

function hasVoted(comment, userId) {
    for (var j = 0; j < comment.votes.length; j++) {
        if (userId == comment.votes[j].user) {
            return true
        }
    }
    return false
}

function removeVotesField(comments) {
    for(var i=0; i<comments.length; i++) {
        delete comments[i].votes
        if(comments[i].children.length > 0) {
            for(var index in comments[i].children) {
                delete comments[i].children[index].votes
            }
        }
    }
}

module.exports.create = create
module.exports.get = get