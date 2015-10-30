var _ = require("underscore")

var Boom = require('boom')
var CONFIG = require('../config/config')
var MESSAGES = require('../config/messages')
var HISTORY_MESSAGES = MESSAGES.HISTORY_MESSAGES
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
    let historyEvent = yield History.create({type: type, user: userId, params: params})
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

    interestedUsers = _.uniq(interestedUsers, (obj) => {return String(obj)})
    historyEvent = yield History.findOne(historyEvent).populate('user')
    EventEmitter.emit('refresh', {interestedUsers: interestedUsers}, historyEvent)
}

export function* postRefreshEvent(userId) {
    EventEmitter.emit('refresh', {interestedUsers: [userId]})
    return Boom.OK()
}

export function* getHistory(userId, date, toDate = new Date(date.getTime() + DAY_MILLISECONDS)) {
    let user = yield UsersHandler.find(userId)
    if (user == null) {
        return Boom.notFound("User is not existing!")
    }
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
        'params.followingId': userId
    }).populate('user').exec())
    let events = yield getPopulatedResponseWithIsFollowing(userId, results)
    events = _.sortBy(events, function(event) {
        return event.createdAt
    })
    let fromDateStr = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate()
    let toDateStr = toDate.getUTCFullYear() + '-' + (toDate.getUTCMonth() + 1) + '-' + toDate.getUTCDate()
    events = _.uniq(events, (obj) => {return String(obj._id)})
    return {events: events.reverse(), fromDate: fromDateStr, toDate: toDateStr}
}

export function* getUnseenHistory(userId, eventId, dateStr) {
    var tomorrow = new Date(new Date().getTime() + DAY_MILLISECONDS)
    var historyEvents = (yield getHistory(userId, new Date(dateStr), tomorrow)).events
    let newEventsIds = []
    for(let event of historyEvents) {
        if(event._id == eventId) {
            break
        }
        newEventsIds.push(event._id)
    }
    return newEventsIds
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
        if(result.user.isFollowing == true && result.type == HISTORY_EVENT_TYPES.APP_APPROVED) {
            result.text = String.format(MESSAGES.FOLLOWING_APP_APPROVED_HISTORY_MESSAGE, result.user.name, result.params.appName)
        } else {
            result.text = getText(result.type, result.params)
        }
    }

    return response
}

export function getText(type, params) {
    let message = HISTORY_MESSAGES[type]
    let text = ""
    switch (type) {
        case HISTORY_EVENT_TYPES.APP_APPROVED:
        case HISTORY_EVENT_TYPES.APP_REJECTED:
            text = String.format(message, params.appName)
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_CREATED:
            text = String.format(message, params.userName, params.collectionName)
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED:
            text = String.format(message, params.collectionName, params.userName)
            break;
        case HISTORY_EVENT_TYPES.COLLECTION_UPDATED:
            text = String.format(message, params.collectionName)
            break;
        case HISTORY_EVENT_TYPES.APP_FAVOURITED:
        case HISTORY_EVENT_TYPES.USER_COMMENT:
        case HISTORY_EVENT_TYPES.USER_MENTIONED:
            text = String.format(message, params.appName, params.userName)
            break;
        case HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS:
        case HISTORY_EVENT_TYPES.USER_FOLLOWED:
            text = String.format(message, params.userName)
            break;
        default:
            return "";
    }

    return text

}

function* getEventsForApps(createdAt, userId) {
    let results = []
    let apps = (yield AppsHandler.getAppsForUser(userId)).apps
    for (let app of apps) {
        let appEvents = yield History.find({createdAt: createdAt, user: {$ne: userId}, 'params.appId': app._id}).populate('user').exec()
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
            'params.collectionId': collection._id
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
        let collectionEvents = yield History.find({createdAt: createdAt, 'params.collectionId': collection._id})
            .populate('user').exec()
        for (let event of collectionEvents) {
            if (event.type == HISTORY_EVENT_TYPES.COLLECTION_UPDATED) {
                results.push(event)
            }
        }
    }
    return results
}

export function* deleteEventsForApp(appId) {
    yield History.remove({'params.appId': appId}).exec()
}