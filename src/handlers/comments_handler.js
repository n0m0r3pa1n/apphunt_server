var _ = require("underscore")
var Boom = require('boom')
var CONFIG  = require('../config/config')
var MESSAGES  = require('../config/messages')
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES
var STATUS_CODES = CONFIG.STATUS_CODES
var CONVERSATION_SYMBOL = '@'

var Comment = require('../models').Comment

var VotesHandler = require('./votes_handler')

import * as PaginationHandler from './pagination_handler.js'
import * as NotificationsHandler  from './notifications_handler.js'
import * as FollowersHandler from './followers_handler.js'
import * as AppsHandler from './apps_handler.js'
import * as UsersHandler from './users_handler.js'
import * as HistoryHandler from './history_handler.js'


export function* create(comment, appId, userId, parentId) {
    var app = yield AppsHandler.getApp(appId, userId)
    if (app.isBoom != undefined && app.isBoom == true) {
        return Boom.notFound("Non-existing app")
    }

    var user = yield UsersHandler.find(userId)
    if(user == null) {
        return Boom.notFound("Non-existing user")
    }

    var parentComment = null;
    if(parentId !== undefined) {
        parentComment = yield Comment.findById(parentId).exec()
        if(!parentComment) {
            return Boom.notFound("Non-existing parent comment")
        }
    }

    comment.app = app
    comment.createdBy = user

    comment.parent = parentComment
    var createdComment = yield Comment.create(comment)
    var createdCommentObject = createdComment.toObject();
    createdCommentObject.id = String(createdCommentObject._id);

    createdCommentObject.hasVoted = false;
    if(parentComment != null) {
        parentComment.children.push(createdComment)

        parentComment.save()
        createdCommentObject.parent.id = String(createdCommentObject.parent._id);
    }

    if(isConversationComment(comment.text)) {
        var userName = getCommentedUserName(comment.text)
        if(userName !== '') {
            var mentionedUser = yield UsersHandler.findByUsername(userName)
            if(mentionedUser !== null) {
                var title = String.format(MESSAGES.USER_MENTIONED_TITLE, user.username)
                var message = comment.text
                NotificationsHandler.sendNotifications(mentionedUser.devices, title, message, user.profilePicture,
                    NOTIFICATION_TYPES.USER_MENTIONED, {appId: appId})
                yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_MENTIONED, userId, {mentionedUserId: String(mentionedUser._id),
                    appId: String(app._id), appName: app.name, userName: user.name})
            }
        }
    } else {
        var title = String.format(MESSAGES.USER_COMMENTED_TITLE, user.username, app.name)
        var message = comment.text
        let isFollowing = yield FollowersHandler.isFollowing(app.createdBy._id, userId)
        if(isFollowing) {
            NotificationsHandler.sendNotifications(app.createdBy.devices, title, message, user.profilePicture,
                NOTIFICATION_TYPES.FOLLOWING_COMMENTED_APP, {appId: appId})
        }

        yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_COMMENT, user._id, {appId: app._id,
            appName: app.name, userName: user.name})
    }

    return createdCommentObject
}

function isConversationComment(commentText) {
    return !(commentText.search(CONVERSATION_SYMBOL) == -1)
}

function getCommentedUserName(commentText) {
    var userName = "";
    var conversationSymbolPosition = commentText.search(CONVERSATION_SYMBOL);
    var usernameMatches = commentText.match("\@[a-zA-Z0-9_]+")
    if(usernameMatches.length === 0) {
        return userName;
    }
    userName = usernameMatches[0]
    userName = userName.slice(1, userName.length)

    return userName;
}

export function* get(appId, userId, page,  pageSize) {
    var where = {app: appId, parent: null}
    var query = Comment.find(where).deepPopulate("children.createdBy children.votes").populate('votes').populate("createdBy")
    query.sort({ createdAt: 'desc' })

    if(page != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize)
    }

    var resultComments = yield PaginationHandler.getPaginatedResultsWithNameAndCount(query, "comments", Comment.count({app: appId}), page, pageSize)
    if(userId !== undefined) {
        resultComments.comments = yield VotesHandler.setHasUserVotedForCommentField(resultComments.comments, userId)
    }

    removeVotesField(resultComments.comments)

    return resultComments
}

export function* getCount(appId) {
    var where = {app: appId}
    return yield Comment.count(where).exec()
}

function removeVotesField(comments) {
    for(var i=0; i<comments.length; i++) {
        if(comments[i] instanceof Comment) {
            comments[i] = comments[i].toObject()
        }
        delete comments[i].votes
        if(comments[i].children.length > 0) {
            for(var index in comments[i].children) {
                delete comments[i].children[index].votes
            }
        }
    }
}

export function* deleteComment(commentId) {
    var comment = yield Comment.findById(commentId).exec()
    if(comment == null) {
        return Boom.OK();
    }

    if(comment.children.length > 0) {
        for(let childId of comment.children) {
            let childComment = yield Comment.findById(childId).exec()
            if(childComment) {
                yield deleteComment(childId)
            }
        }
    }

    if(comment.parent != null) {
        var parent = yield Comment.findById(comment.parent).exec()
        if(parent == null) {
            comment.parent = null;
            yield comment.save();
        } else {
            for(var i=0; i<parent.children.length; i++) {
                var childId = parent.children[i]
                if(childId == commentId) {
                    parent.children.splice(i, 1);
                }
            }
            yield parent.save()
        }
    }

    yield VotesHandler.deleteVotesByIds(comment.votes)
    yield Comment.remove({_id: commentId}).exec()

    return Boom.OK()
}

export function* clearAppComments(appId) {
    var comments = yield Comment.find({app: appId, parent: null}).exec()
    for(var i=0; i<comments.length; i++) {
        var comment = comments[i]
        yield deleteComment(comment._id)
    }
    return Boom.OK()
}

export function* getCommentsForUser(creatorId, userId, page, pageSize) {
    var query = Comment.find({createdBy: creatorId}).deepPopulate("children.createdBy children.votes").populate('createdBy votes')
    query.sort({ votesCount: 'desc', createdAt: 'desc' })
    let result = yield PaginationHandler.getPaginatedResultsWithName(query, "comments", page, pageSize)
    if(userId !== undefined) {
        result.comments = yield VotesHandler.setHasUserVotedForCommentField(result.comments, userId)
    }
    for(let comment of result.comments) {

    }
    removeVotesField(result.comments)
    for(let comment of result.comments) {
        comment.app = yield AppsHandler.getApp(comment.app)
    }

    return result;
}

export function* getComments(fromDate, toDate) {
    var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
    toDate = new Date(toDate.getTime() + DAY_MILLISECONDS);

    let where = {
        createdAt: {
            "$gte": new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
            "$lt": new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
        }
    }

    return yield Comment.find(where).deepPopulate("children.createdBy children.votes").populate('app createdBy votes')
}


module.exports.get = get
module.exports.deleteComment = deleteComment
module.exports.clearAppComments = clearAppComments