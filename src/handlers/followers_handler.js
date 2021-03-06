var Boom = require('boom')

var Mongoose = require('mongoose')
var User = require('../models').User
var Follower = require('../models').Follower

import * as PaginationHandler from './pagination_handler.js'
import * as UsersHandler from './users_handler.js'
import * as HistoryHandler from './history_handler.js'
import * as NotificationsHandler  from './notifications_handler.js'

var CONFIG = require('../config/config')
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES


export function* getFollowers(profileId, userId, page = 0, pageSize = 0) {
    let query = Follower.find({following: profileId}).select("-_id follower").populate("follower")
    let result = yield PaginationHandler.getPaginatedResultsWithName(query, "followers", page, pageSize)
    let followers = []
    for(let item of result.followers) {
        let follower = item.follower.toObject()
        follower.id = item.follower._id
        follower.isFollowing = yield isFollowing(userId, follower._id)
        followers.push(follower)
    }
    result.followers = followers
    return result
}

export function* getPopulatedFollowers(userProfileId, currentUserId) {
    let followers = (yield getFollowers(userProfileId)).followers
    return yield getPopulatedIsFollowing(currentUserId, followers)
}

export function* getPopulatedFollowing(userProfileId, currentUserId) {
    let followings = (yield getFollowing(userProfileId)).following
    return yield getPopulatedIsFollowing(currentUserId, followings)
}

function* getPopulatedIsFollowing(followerId, users) {
    let result = []
    for(let user of users) {
        if(user instanceof User) {
            user = user.toObject()
        }
        user.isFollowing = yield isFollowing(followerId, user._id)
        result.push(user)
    }
    return result;
}


export function* getFollowing(profileId, userId = undefined, page = 0, pageSize = 0) {
    let query = Follower.find({follower: profileId}).select("-_id following").populate("following")
    let result = yield PaginationHandler.getPaginatedResultsWithName(query, "following", page, pageSize)
    let followings = []
    for(let item of result.following) {
        let following = item.following.toObject()
        following.id = item.following._id
        following.isFollowing = yield isFollowing(userId, following._id)
        followings.push(following)
    }

    result.following = followings
    return result
}

export function* isFollowing(followerId, followingId) {
    if(followerId == undefined || followingId == undefined) {
        return false
    }
    return (yield Follower.count({following: followingId, follower: followerId}).exec()) > 0
}

export function* followUser(followingId, followerId) {
    let following = yield UsersHandler.find(followingId)
    if(following == null) {
        return Boom.notFound("User is not existing!")
    }

    let follower = yield UsersHandler.find(followerId)
    if(follower == null) {
        return Boom.notFound("User is not existing!")
    }

    yield followSingleUser(followingId, followerId)

    let title = "App hunter followed you"
    let message = HistoryHandler.getText(HISTORY_EVENT_TYPES.USER_FOLLOWED, {userName: follower.name})
    yield NotificationsHandler.sendNotificationsToUsers([followingId], title, message, follower.profilePicture,
        NOTIFICATION_TYPES.USER_FOLLOWED, {followerId: followerId})
    return Boom.OK()
}

export function* addFollowings(userId, followingIds) {
    let user = yield UsersHandler.find(userId)
    if(user == null) {
        return Boom.notFound("User is not existing!")
    }

    if(followingIds == undefined || followingIds.length == 0) {
        return Boom.badRequest("Following ids are required")
    }

    for(let followingId of followingIds) {
        let following = yield UsersHandler.find(followingId)
        if(following == null) {
            continue;
        }

        yield followSingleUser(followingId, userId)
    }

    return Boom.OK()
}

export function* addFollowers(followingId, followerIds) {
    let following = yield UsersHandler.find(followingId)
    if(following == null) {
        return Boom.notFound("User is not existing!")
    }

    if(followerIds == undefined || followerIds.length == 0) {
        return Boom.badRequest("Follower ids are required")
    }

    for(let userId of followerIds) {
        let follower = yield UsersHandler.find(userId)
        if(follower == null) {
            continue;
        }

        yield followSingleUser(followingId, userId)
    }

    let title = "You are a followers dream"
    yield NotificationsHandler.sendNotificationsToUsers([followingId], title, followerIds.length + " users followed you!",
        following.profilePicture, NOTIFICATION_TYPES.USER_FOLLOWED)
    return Boom.OK()
}

function* followSingleUser(followingId, followerId) {
    let user = yield UsersHandler.find(followerId)
    if(user == null) {
        return Boom.notFound('Follower cannot be found!')
    }
    var test = yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_FOLLOWED, followerId, {followingId: followingId, userName: user.name})
    yield Follower.findOneOrCreate({following: followingId, follower: followerId},{following: followingId, follower: followerId})
}

export function* unfollowUser(followingId, followerId) {
    let following = yield UsersHandler.find(followingId)
    if(following == null) {
        return Boom.notFound("User is not existing!")
    }

    let follower = yield UsersHandler.find(followerId)
    if(follower == null) {
        return Boom.notFound("User is not existing!")
    }

    yield Follower.remove({following: followingId, follower: followerId}).exec()

    return Boom.OK()
}

export function* getFollowersIds(userId) {
    let followers = (yield getFollowers(userId)).followers
    let userIds = []
    for(let follower of followers) {
        userIds.push(follower._id)
    }

    return userIds
}