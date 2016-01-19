'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.create = create;
exports.get = get;
exports.getCount = getCount;
exports.deleteComment = deleteComment;
exports.clearAppComments = clearAppComments;
exports.getCommentsForUser = getCommentsForUser;
exports.getComments = getComments;
exports.getUnpopulatedComments = getUnpopulatedComments;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _pagination_handlerJs = require('./pagination_handler.js');

var PaginationHandler = _interopRequireWildcard(_pagination_handlerJs);

var _notifications_handlerJs = require('./notifications_handler.js');

var NotificationsHandler = _interopRequireWildcard(_notifications_handlerJs);

var _followers_handlerJs = require('./followers_handler.js');

var FollowersHandler = _interopRequireWildcard(_followers_handlerJs);

var _apps_handlerJs = require('./apps_handler.js');

var AppsHandler = _interopRequireWildcard(_apps_handlerJs);

var _users_handlerJs = require('./users_handler.js');

var UsersHandler = _interopRequireWildcard(_users_handlerJs);

var _history_handlerJs = require('./history_handler.js');

var HistoryHandler = _interopRequireWildcard(_history_handlerJs);

var _ = require('underscore');
var Boom = require('boom');
var CONFIG = require('../config/config');
var MESSAGES = require('../config/messages');
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES;
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES;
var STATUS_CODES = CONFIG.STATUS_CODES;
var CONVERSATION_SYMBOL = '@';

var Comment = require('../models').Comment;

var VotesHandler = require('./votes_handler');

function* create(comment, appId, userId, parentId, mentionedUserId) {
    var app = yield AppsHandler.getApp(appId, userId);
    if (app.isBoom != undefined && app.isBoom == true) {
        return Boom.notFound('Non-existing app');
    }

    var user = yield UsersHandler.find(userId);
    if (user == null) {
        return Boom.notFound('Non-existing user');
    }

    var parentComment = null;
    if (parentId !== undefined) {
        parentComment = yield Comment.findById(parentId).exec();
        if (!parentComment) {
            return Boom.notFound('Non-existing parent comment');
        }
    }

    comment.app = app;
    comment.createdBy = user;

    comment.parent = parentComment;
    var createdComment = yield Comment.create(comment);
    var createdCommentObject = createdComment.toObject();
    createdCommentObject.id = String(createdCommentObject._id);

    createdCommentObject.hasVoted = false;
    if (parentComment != null) {
        parentComment.children.push(createdComment);

        parentComment.save();
        createdCommentObject.parent.id = String(createdCommentObject.parent._id);
    }

    if (mentionedUserId) {
        var mentionedUser = yield UsersHandler.findWithDevices(mentionedUserId);
        if (mentionedUser !== null) {
            yield notifyForComment(app, comment, user, mentionedUser);
        }
    } else if (isConversationComment(comment.text)) {
        var userName = getCommentedUserName(comment.text);
        if (userName !== '') {
            var mentionedUser = yield UsersHandler.findByUsername(userName);
            if (mentionedUser !== null) {
                yield notifyForComment(app, comment, user, mentionedUser);
            }
        }
    } else {
        var title = String.format(MESSAGES.USER_COMMENTED_TITLE, user.username, app.name);
        var message = comment.text;
        NotificationsHandler.sendNotifications(app.createdBy.devices, title, message, user.profilePicture, NOTIFICATION_TYPES.USER_COMMENT, { appId: appId });

        yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_COMMENT, user._id, { appId: app._id,
            appName: app.name, userName: user.name });
    }

    return createdCommentObject;
}

function* notifyForComment(app, comment, user, mentionedUser) {
    var title = String.format(MESSAGES.USER_MENTIONED_TITLE, user.username);
    var message = comment.text;
    NotificationsHandler.sendNotifications(mentionedUser.devices, title, message, user.profilePicture, NOTIFICATION_TYPES.USER_MENTIONED, { appId: app._id });
    yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_MENTIONED, user._id, { mentionedUserId: String(mentionedUser._id),
        appId: app._id, appName: app.name, userName: user.name });
}

function isConversationComment(commentText) {
    return !(commentText.search(CONVERSATION_SYMBOL) == -1);
}

function getCommentedUserName(commentText) {
    var userName = '';
    var conversationSymbolPosition = commentText.search(CONVERSATION_SYMBOL);
    var usernameMatches = commentText.match('@[a-zA-Z0-9_]+');
    if (usernameMatches.length === 0) {
        return userName;
    }
    userName = usernameMatches[0];
    userName = userName.slice(1, userName.length);

    return userName;
}

function* get(appId, userId, page, pageSize) {
    var where = { app: appId, parent: null };
    var query = Comment.find(where).deepPopulate('children.createdBy children.votes').populate('votes').populate('createdBy');
    query.sort({ createdAt: 'desc' });

    if (page != 0 && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize);
    }

    var resultComments = yield PaginationHandler.getPaginatedResultsWithNameAndCount(query, 'comments', Comment.count({ app: appId }), page, pageSize);
    if (userId !== undefined) {
        resultComments.comments = yield VotesHandler.setHasUserVotedForCommentField(resultComments.comments, userId);
    }

    removeVotesField(resultComments.comments);

    return resultComments;
}

function* getCount(appId) {
    var where = { app: appId };
    return yield Comment.count(where).exec();
}

function removeVotesField(comments) {
    for (var i = 0; i < comments.length; i++) {
        if (comments[i] instanceof Comment) {
            comments[i] = comments[i].toObject();
        }
        delete comments[i].votes;
        if (comments[i].children.length > 0) {
            for (var index in comments[i].children) {
                delete comments[i].children[index].votes;
            }
        }
    }
}

function* deleteComment(commentId) {
    var comment = yield Comment.findById(commentId).exec();
    if (comment == null) {
        return Boom.OK();
    }

    if (comment.children.length > 0) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = comment.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _childId = _step.value;

                var childComment = yield Comment.findById(_childId).exec();
                if (childComment) {
                    yield deleteComment(_childId);
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }

    if (comment.parent != null) {
        var parent = yield Comment.findById(comment.parent).exec();
        if (parent == null) {
            comment.parent = null;
            yield comment.save();
        } else {
            for (var i = 0; i < parent.children.length; i++) {
                var childId = parent.children[i];
                if (childId == commentId) {
                    parent.children.splice(i, 1);
                }
            }
            yield parent.save();
        }
    }

    yield VotesHandler.deleteVotesByIds(comment.votes);
    yield Comment.remove({ _id: commentId }).exec();

    return Boom.OK();
}

function* clearAppComments(appId) {
    var comments = yield Comment.find({ app: appId, parent: null }).exec();
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        yield deleteComment(comment._id);
    }
    return Boom.OK();
}

function* getCommentsForUser(creatorId, userId, page, pageSize) {
    var query = Comment.find({ createdBy: creatorId }).deepPopulate('children.createdBy children.votes').populate('createdBy votes');
    query.sort({ votesCount: 'desc', createdAt: 'desc' });
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, 'comments', page, pageSize);
    if (userId !== undefined) {
        result.comments = yield VotesHandler.setHasUserVotedForCommentField(result.comments, userId);
    }
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = result.comments[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var comment = _step2.value;
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                _iterator2['return']();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    removeVotesField(result.comments);
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = result.comments[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var comment = _step3.value;

            comment.app = yield AppsHandler.getApp(comment.app);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                _iterator3['return']();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return result;
}

function* getComments(fromDate, toDate) {
    var DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
    toDate = new Date(toDate.getTime() + DAY_MILLISECONDS);

    var where = {
        createdAt: {
            '$gte': new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
            '$lt': new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
        }
    };

    return yield Comment.find(where).deepPopulate('children.createdBy children.votes').populate('app createdBy votes');
}

function* getUnpopulatedComments(fromDate, toDate) {
    var DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
    toDate = new Date(toDate.getTime() + DAY_MILLISECONDS);

    var where = {
        createdAt: {
            '$gte': new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
            '$lt': new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
        }
    };

    return yield Comment.find(where).populate('app').deepPopulate('app.categories app.createdBy').exec();
}

module.exports.get = get;
module.exports.deleteComment = deleteComment;
module.exports.clearAppComments = clearAppComments;