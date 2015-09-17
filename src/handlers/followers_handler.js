var Boom = require('boom')

var Mongoose = require('mongoose')
var User = require('../models').User
var Follower = require('../models').Follower

import * as PaginationHandler from './pagination_handler.js'
import * as UsersHandler from './users_handler.js'
import * as HistoryHandler from './history_handler.js'

var HISTORY_EVENT_TYPES = require('../config/config').HISTORY_EVENT_TYPES


export function* getFollowers(userId, page, pageSize) {
    let query = Follower.find({following: userId}).select("-_id follower").populate("follower")
    let result = yield PaginationHandler.getPaginatedResultsWithName(query, "followers", page, pageSize)
    let followers = []
    for(let item of result.followers) {
        followers.push(item.follower)
    }

    result.followers = followers
    return result
}

export function* getFollowing(userId, page, pageSize) {
    let query = Follower.find({follower: userId}).select("-_id following").populate("following")
    let result = yield PaginationHandler.getPaginatedResultsWithName(query, "following", page, pageSize)
    let following = []
    for(let item of result.following) {
        following.push(item.following)
    }

    result.following = following
    return result
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

    yield Follower.findOneOrCreate({following: followingId, follower: followerId},{following: followingId, follower: followerId})
    yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_FOLLOWED, followerId, {followingId: followingId})
    return Boom.OK()
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