var _ = require("underscore")
var Boom = require('boom')
var CONFIG = require('../config/config')

var History = require('../models').History

import * as UsersHandler from './users_handler.js'
import * as FollowersHandler from './followers_handler.js'
import * as AppsHandler from './apps_handler.js'
import * as CollectionsHandler from './apps_collections_handler.js'

let HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000


export function* createEvent(type, userId, params = {}) {
    yield History.create({type: type, user: userId, params: params})
}

export function* getHistory(userId, date) {
    let user = yield UsersHandler.find(userId)
    if (user == null) {
        return Boom.notFound("User is not existing!")
    }

    var toDate = new Date(date.getTime() + DAY_MILLISECONDS);
    var where = {}
    where.createdAt = {
        "$gte": new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
        "$lt": toDate.toISOString()
    };
    where.user = userId
    where.type = {
        $in: [HISTORY_EVENT_TYPES.APP_APPROVED,
            HISTORY_EVENT_TYPES.APP_REJECTED]
    }

    let userEvents = yield History.find(where).populate('user').exec()
    let results = [...userEvents]
    results = results.concat((yield getEventsForApps(where.createdAt, userId)))
    results = results.concat((yield getEventsForCollections(where.createdAt, userId)))
    results = results.concat((yield History.find({
        createdAt: where.createdAt,
        type: HISTORY_EVENT_TYPES.USER_MENTIONED,
        'params.mentionedUserId': userId
    }).populate('user').exec()))
    results = results.concat((yield getEventsForFavouriteCollections(where.createdAt, userId)))
    results = results.concat((yield getEventsForFollowings(where.createdAt, userId)))
    results = results.concat(yield History.find({
        createdAt: where.createdAt,
        type: HISTORY_EVENT_TYPES.USER_FOLLOWED,
        params: {followingId: userId}
    }).populate('user').exec())

    let followings = (yield FollowersHandler.getFollowing(userId)).following
    let followingIds = []
    for(let following of followings) {
        followingIds.push(String(following._id))
    }

    var response = []
    for(let result of results) {
        result = result.toObject()
        result.user.isFollowing = false
        if(_.contains(followingIds, String(result.user._id))) {
            result.user.isFollowing = true
        }
        response.push(result)
    }

    return response
}

function* getEventsForApps(createdAt, userId) {
    let results = []
    let apps = (yield AppsHandler.getAppsForUser(userId)).apps
    for (let app of apps) {
        let appEvents = yield History.find({createdAt: createdAt, user: {$ne: userId}, params: {appId: app._id}}).populate('user').exec()
        for (let event of appEvents) {
            if (event.type == HISTORY_EVENT_TYPES.APP_FAVOURITED || event.type == HISTORY_EVENT_TYPES.USER_COMMENT) {
                results.push(event)
            }
        }
    }
    return results
}

function* getEventsForFollowings(createdAt, userId) {
    let results = []
    let where = {}
    where.createdAt = createdAt
    let followings = (yield FollowersHandler.getFollowing(userId)).following
    for (let following of followings) {
        where.user = following.id
        where.type = {
            $in: [HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS,
                HISTORY_EVENT_TYPES.COLLECTION_CREATED,
                HISTORY_EVENT_TYPES.APP_APPROVED,
                HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED,
                HISTORY_EVENT_TYPES.APP_FAVOURITED]
        }
        results = results.concat(yield History.find(where).populate('user').exec())
    }

    return results
}

function* getEventsForCollections(createdAt, userId) {
    let results = []
    let collections = (yield CollectionsHandler.getCollections(userId)).collections
    for (let collection of collections) {
        let collectionEvents = yield History.find({
            createdAt: createdAt,
            user: {$ne: userId},
            params: {collectionId: collection._id}
        }).populate('user').exec()

        for (let event of collectionEvents) {
            if (event.type == HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED) {
                results.push(event)
            }
        }
    }
    return results
}

function* getEventsForFavouriteCollections(createdAt, userId) {
    let results = []
    let collections = (yield CollectionsHandler.getFavouriteCollections(userId)).collections
    for (let collection of collections) {
        let collectionEvents = yield History.find({createdAt: createdAt, params: {collectionId: collection._id}})
            .populate('user').exec()
        for (let event of collectionEvents) {
            if (event.type == HISTORY_EVENT_TYPES.COLLECTION_UPDATED) {
                results.push(event)
            }
        }
    }
    return results
}