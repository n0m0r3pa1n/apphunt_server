var _ = require("underscore")

var Boom = require('boom')
var CONFIG = require('../config/config')
var History = require('../models').History

import * as UsersHandler from './users_handler.js'
import * as FollowersHandler from './followers_handler.js'
import * as AppsHandler from './apps_handler.js'
import * as CollectionsHandler from './apps_collections_handler.js'
import {EventEmitter} from './utils/event_emitter.js'

var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES
var NOTIFICATIONS_TYPES = CONFIG.NOTIFICATION_TYPES

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000


export function* createEvent(type, userId, params = {}) {
    yield History.create({type: type, user: userId, params: params})
    let interestedUsers = []
    switch(type) {
        case HISTORY_EVENT_TYPES.APP_APPROVED:
            interestedUsers = yield FollowersHandler.getFollowersIds(String(userId))
            interestedUsers.push(userId)
            break;
        case HISTORY_EVENT_TYPES.APP_REJECTED:
            interestedUsers.push(userId)
            break;
        case HISTORY_EVENT_TYPES.APP_FAVOURITED:
            interestedUsers = yield FollowersHandler.getFollowersIds(userId)
            let app = yield AppsHandler.getApp(params.appId)
            if(userId != app.createdBy._id) {
                interestedUsers.push(app.createdBy._id)
            }
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_CREATED:
            interestedUsers = yield FollowersHandler.getFollowersIds(userId)
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED:
            interestedUsers = yield FollowersHandler.getFollowersIds(userId)
            let collection = yield CollectionsHandler.get(params.collectionId)
            if(userId != collection.createdBy._id) {
                interestedUsers.push(collection.createdBy._id)
            }
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_UPDATED:
            interestedUsers = (yield CollectionsHandler.get(params.collectionId)).favouritedBy
            break;
        case HISTORY_EVENT_TYPES.USER_COMMENT:
            interestedUsers = yield FollowersHandler.getFollowersIds(userId)
            interestedUsers.push((yield AppsHandler.getApp(params.appId)).createdBy._id)
            break;
        case HISTORY_EVENT_TYPES.USER_MENTIONED:
            interestedUsers.push(params.mentionedUserId)
            break;
        case HISTORY_EVENT_TYPES.USER_FOLLOWED:
            interestedUsers.push(params.followingId)
            break;
        case HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS:
            //TODO
            break;
        default:
            return;
    }

    EventEmitter.emit('refresh', {interestedUsers: interestedUsers})
}

export function* postRefreshEvent(userId) {
    EventEmitter.emit('refresh', {userId: userId})
    return Boom.OK()
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

    return yield getPopulatedResponseWithIsFollowing(userId, results)
}

function* getPopulatedResponseWithIsFollowing(userId, results) {
    let followings = (yield FollowersHandler.getFollowing(userId)).following
    let followingIds = []
    for(let following of followings) {
        followingIds.push(String(following._id))
    }

    var response = []
    for(let result of results) {
        result = result.toObject()
        result.user.isFollowing = _.contains(followingIds, String(result.user._id));
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