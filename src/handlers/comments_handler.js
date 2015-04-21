var _ = require("underscore")

var CONFIG  = require('../config/config')
var STATUS_CODES = CONFIG.STATUS_CODES
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES
var CONVERSATION_SYMBOL = '@'

var App = require('../models').App
var User = require('../models').User
var Comment = require('../models').Comment
var Vote = require('../models').Vote

var VotesHandler = require('./votes_handler')
var NotificationsHandler = require('./notifications_handler')

function* create(comment, appId, userId, parentId) {
    var app = yield App.findById(appId).populate('createdBy').exec()
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
            var mentionedUser = yield User.findOne({username: userName}).exec()
            if(mentionedUser !== null) {
                var title = String.format(CONFIG.USER_MENTIONED_TITLE, user.username)
                var message = comment.text
                yield NotificationsHandler.sendNotificationToUser(mentionedUser, title, message, user.profilePicture,
                    NOTIFICATION_TYPES.USER_MENTIONED)
            }
        }
    } else {
            var title = String.format(CONFIG.USER_COMMENTED_TITLE, user.username, app.name)
            var message = comment.text
            yield NotificationsHandler.sendNotificationToUser(app.createdBy, title, message, user.profilePicture,
                NOTIFICATION_TYPES.USER_COMMENT)
    }

    return createdCommentObject
}

function isConversationComment(commentText) {
    return !(commentText.search(CONVERSATION_SYMBOL) == -1)
}

function getCommentedUserName(commentText) {
    var userName = "";
    var conversationSymbolPosition = commentText.search(CONVERSATION_SYMBOL);
    var usernameMatches = commentText.match("\@[a-zA-Z]+")
    if(usernameMatches.length === 0) {
        return userName;
    }
    userName = usernameMatches[0]
    userName = userName.slice(1, userName.length)

    return userName;
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
        resultComments = yield VotesHandler.setHasUserVotedForCommentField(resultComments, userId)
    }

    var allCommentsCount = yield Comment.count({app: appId}).exec()

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

function* getCount(appId) {
	var where = {app: appId}
	var result = yield Comment.count(where).exec()

	return result
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

function* deleteComment(commentId) {
    var comment = yield Comment.findById(commentId).exec()
    if(comment.children.length > 0) {
        var childrenIds = comment.children
        for(var i=0; i<childrenIds.length; i++) {
            yield deleteComment(childrenIds[i])
        }
    }
    if(comment.parent != null) {
        var parent = yield Comment.findById(comment.parent).exec()
        for(var i=0; i<parent.children.length; i++) {
            var childId = parent.children[i]
            if(childId == commentId) {
                parent.children.splice(i, 1);
            }
        }
        yield parent.save()
    }

    var votesIds = comment.votes
    for(var i=0; i<votesIds.length; i++) {
        yield Vote.remove({_id: votesIds[i]}).exec()
    }

    yield Comment.remove({_id: commentId}).exec()

    return {
        statusCode: STATUS_CODES.OK
    }
}

function* clearAppComments(appId) {
    var comments = yield Comment.find({app: appId, parent: null}).exec()
    for(var i=0; i<comments.length; i++) {
        var comment = comments[i]
        yield deleteComment(comment._id)
    }
}

module.exports.create = create
module.exports.get = get
module.exports.getCount = getCount
module.exports.deleteComment = deleteComment
module.exports.clearAppComments = clearAppComments