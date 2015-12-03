"use strict";

var _ = require("underscore");
var models = require("../models");
var UsersCollection = models.UsersCollection;
var User = models.User;
var App = models.App;
var Vote = models.Vote;
var Comment = models.Comment;
var AppsCollection = models.AppsCollection;

var CONFIG = require("../config/config");
var COLLECTION_STATUS = CONFIG.COLLECTION_STATUSES;
var APP_STATUSES = CONFIG.APP_STATUSES;
var Points = CONFIG.Points;

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function* getUserDetails(userId, fromDate, toDate) {

    var userDetails = {
        user: userId,
        addedApps: 0,
        comments: 0,
        votes: 0,
        collections: 0,
        score: 0
    };

    var query = {};
    if (toDate !== undefined && fromDate !== undefined) {
        toDate.setDate(toDate.getUTCDate() + 1);
        query = {
            createdAt: {
                "$gte": new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
                "$lt": new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
            }
        };
    }

    userDetails.votes = yield Vote.count(_.extend({ user: userId }, query)).exec();

    query.createdBy = userId;
    userDetails.addedApps = yield App.count(query).exec();
    userDetails.comments = yield Comment.count(query).exec();
    userDetails.collections = yield AppsCollection.count(_.extend(query, { status: COLLECTION_STATUS.PUBLIC })).exec();
    userDetails.score = userDetails.votes * Points.vote + userDetails.comments * Points.comment + userDetails.addedApps * Points.app + userDetails.collections * Points.collection;
    return userDetails;
}

function* getUsersScore(fromDate, toDate) {
    toDate = new Date(toDate.getTime() + DAY_MILLISECONDS);
    var whereDatesRange = {
        createdAt: {
            "$gte": new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
            "$lt": new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
        }
    };

    var comments = yield Comment.find(whereDatesRange).exec();
    var commentsResults = _.countBy(comments, function (comment) {
        return comment.createdBy;
    });
    var commentsUserIds = _.keys(commentsResults);

    var votes = yield Vote.find(whereDatesRange).exec();
    var votesResults = _.countBy(votes, function (vote) {
        return vote.user;
    });
    var votesUserIds = _.keys(votesResults);

    var apps = yield App.find(_.extend(whereDatesRange, { status: APP_STATUSES.APPROVED })).exec();
    var appsResults = _.countBy(apps, function (app) {
        return app.createdBy;
    });
    var appsUserIds = _.keys(appsResults);

    var collections = yield AppsCollection.find(_.extend(whereDatesRange, { status: COLLECTION_STATUS.PUBLIC })).exec();
    var collectionsResult = _.countBy(collections, function (collection) {
        return collection.createdBy;
    });
    var collectionsUserIds = _.keys(collectionsResult);

    var userIds = _.union(commentsUserIds, votesUserIds, appsUserIds, collectionsUserIds);

    var results = [];
    for (var i = 0; i < userIds.length; i++) {
        var userId = userIds[i];
        var user = yield User.findById(userId).exec();
        user = user.toObject();

        user.comments = 0;
        user.apps = 0;
        user.votes = 0;
        user.collections = 0;
        user.score = 0;

        if (_.has(commentsResults, userId)) {
            user.comments = commentsResults[userId];
            user.score += commentsResults[userId] * Points.comment;
        }
        if (_.has(votesResults, userId)) {
            user.votes = votesResults[userId];
            user.score += votesResults[userId] * Points.vote;
        }
        if (_.has(appsResults, userId)) {
            user.apps = appsResults[userId];
            user.score += appsResults[userId] * Points.app;
        }
        if (_.has(collectionsResult, userId)) {
            user.collections = collectionsResult[userId];
            user.score += collectionsResult[userId] * Points.collection;
        }
        results.push(user);
    }

    results.sort(function (r1, r2) {
        return r2.score - r1.score;
    });

    return results;
}

module.exports.getUserDetails = getUserDetails;
module.exports.getUsersScore = getUsersScore;