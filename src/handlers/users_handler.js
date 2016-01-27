var _ = require('underscore')
var Boom = require('boom')
var Bolt = require("bolt-js")
var TweetComposer = require('../utils/tweet_composer')
var CONFIG = require('../config/config')
var LOGIN_TYPES_FILTER = CONFIG.LOGIN_TYPES_FILTER

var User = require('../models').User
var Anonymous = require('../models').Anonymous
var Device = require('../models').Device
var UserScoreHandler = require('./user_score_handler')
import * as CommentsHandler from './comments_handler'
import * as AppsHandler from './apps_handler.js'
import * as AppsCollectionsHandler from './apps_collections_handler.js'
import * as PaginationHandler from "./pagination_handler.js"

import * as AuthHandler from './authentication_handler.js'
import * as ScoresHandler from './user_score_handler.js'
import * as FollowersHandler from './followers_handler.js'

var UserCollectionsHandler = require('./users_collections_handler')


export function* get(q, loginType, page, pageSize) {
    var where = {}
    if (q !== undefined) {
        where = {
            $or: [{email: {$regex: q, $options: 'i'}},
                {name: {$regex: q, $options: 'i'}},
                {username: {$regex: q, $options: 'i'}}]
        }
    }

    if (loginType !== undefined) {
        if (loginType == LOGIN_TYPES_FILTER.Real) {
            where.loginType = {$ne: LOGIN_TYPES_FILTER.Fake}
        } else {
            where.loginType = loginType
        }

    }

    var query = User.find(where)

    return yield PaginationHandler.getPaginatedResultsWithName(query, "users", page, pageSize);
}

export function getLoginTypes() {
    return _.values(LOGIN_TYPES_FILTER)
}

export function* isTopHunter(userId) {
    let user = yield find(userId)
    if(!user) {
        return Boom.notFound('User does not exist!')
    }
    let topHunters = (yield UserCollectionsHandler.getTopHuntersList()).users
    for(let hunter of topHunters) {
        if(hunter._id == userId) {
            return {isTopHunter: true}
        }
    }

    return {isTopHunter: false}
}

export function* find(userId) {
    return yield User.findById(userId).exec()
}

export function* findWithDevices(userId) {
    return yield User.findById(userId).populate('devices').exec()
}

export function* findByUsername(username) {
    return yield User.findOne({username: username}).populate('devices').exec()
}

export function* getUserDevices(userId) {
    let user = yield User.findById(userId).populate('devices').exec()
    if (user == null) {
        return []
    }

    return user.devices
}

export function* filterExistingUsers(userId, names) {
    let user = yield find(userId)
    if (user == null) {
        return Boom.notFound("User is not existing!")
    }

    let matchingUsers = []
    for (let name of names) {
        let users = yield User.find({name: {$regex: name, $options: 'i'}}).exec()
        matchingUsers = matchingUsers.concat(users)
    }

    return {users: (yield getPopulatedIsFollowing(user.id, matchingUsers))}
}

function* getPopulatedIsFollowing(followerId, users) {
    let result = []
    for (let user of users) {
        user = user.toObject()
        user.isFollowing = yield FollowersHandler.isFollowing(followerId, user._id)
        result.push(user)
    }
    return result;
}

export function* getDeviceIdsForUser(user) {
    if (user.populated('devices')) {
        user = yield User.findOne(user).populate('devices')
    }

    let notificationIds = []
    for (let device of user.devices) {
        notificationIds = notificationIds.concat(device.notificationId)
    }

    return notificationIds
}

export function* getDevicesForUser(userId) {
    let user = yield User.findById(userId).populate('devices').exec()
    return user.devices
}

export function* getDevicesForAllUsers() {
    return yield Device.find({}).exec()
}

export function* getUserProfile(userId, fromDate, toDate, currentUserId) {
    let user = yield find(userId)
    if (user == null) {
        return Boom.notFound("User is not existing!")
    }
    if (currentUserId != undefined) {
        let currentUser = yield find(currentUserId)
        if (currentUser == null) {
            return Boom.notFound("Current user is not existing!")
        }
    }

    user = user.toObject()
    let details = yield ScoresHandler.getUserDetails(userId)
    user.apps = details.addedApps
    user.comments = details.comments
    user.votes = details.votes
    user.collections = details.collections
    user.favouriteApps = yield AppsHandler.getFavouriteAppsCount(userId)
    user.favouriteCollections = yield AppsCollectionsHandler.getCollectionsCount(userId)
    user.score = (yield ScoresHandler.getUserDetails(userId, fromDate, toDate)).score
    if (currentUserId != undefined) {
        user.isFollowing = yield FollowersHandler.isFollowing(currentUserId, userId)
    }

    let followings = currentUserId != undefined ? yield FollowersHandler.getPopulatedFollowing(userId, currentUserId) :
        (yield FollowersHandler.getFollowing(userId)).following;
    user.following = followings
    user.followingCount = followings.length

    let followers = currentUserId != undefined ? yield FollowersHandler.getPopulatedFollowers(userId, currentUserId) :
        (yield FollowersHandler.getFollowers(userId)).followers;
    user.followers = followers
    user.followersCount = followers.length
    return user
}

export function* create(user, notificationId, advertisingId) {
    var currUser = null;

    if (user.loginType == LOGIN_TYPES_FILTER.Anonymous) {
        if (!advertisingId) {
            return Boom.badRequest("advertisingId is empty for anonymous user");
        }
        currUser = yield getAnonymousUser(advertisingId)
    } else {
        if (!user.email) {
            return Boom.badRequest("user email is empty for " + user.loginType + " user");
        }
        currUser = yield getRegisteredUser(user.email)
    }

    if (currUser) {
        yield updateUser(currUser, user)
    } else {
        currUser = yield createUser(user, advertisingId)
        if (currUser.loginType == LOGIN_TYPES_FILTER.Twitter) {
            postTweet(currUser)
            followUser(currUser)
        }
    }

    if (notificationId) {
        yield createUserDevices(currUser, notificationId);
    }

    let myUser = currUser.toObject()
    myUser.token = AuthHandler.generateToken(currUser._id)
    myUser.id = myUser._id;
    return myUser;
}

function* getAnonymousUser(advertisingId) {
    let anonymousUser = yield Anonymous.findOne({advertisingId: advertisingId}).populate('user').exec()
    if (anonymousUser) {
        return yield User.findById(anonymousUser.user).populate('devices').exec()
    } else {
        return null;
    }
}

function* getRegisteredUser(email) {
    return yield User.findOne({email: email}).populate('devices').exec();
}

function* createUser(model, advertisingId) {
    let isAnonymous = false;
    if (model.loginType == LOGIN_TYPES_FILTER.Anonymous) {
        isAnonymous = true
        model.name = "Anonymous"
        model.username = "anonymous"
        model.profilePicture =
            'https://scontent-vie1-1.xx.fbcdn.net/hprofile-xfp1/t31.0-1/c379.0.1290.1290/' +
            '10506738_10150004552801856_220367501106153455_o.jpg'
        model.email = yield getUniqueUserEmail(model.email)
    }

    let user = yield User.create(model)
    if (isAnonymous) {
        yield Anonymous.create({advertisingId: advertisingId, user: user})
    }

    return user
}

function* updateUser(currUser, model) {
    currUser.name = model.name
    currUser.username = model.username
    currUser.profilePicture = model.profilePicture
    currUser.coverPicture = model.coverPicture
    currUser.loginType = model.loginType
    currUser.locale = model.locale
    currUser.appVersion = model.appVersion

    yield currUser.save()
}

function* getUniqueUserEmail(email) {
    if (!email) {
        return yield getUniqueRandomEmail()
    } else {
        let isExistingEmail = yield User.findOne({email: email}).exec();
        if (isExistingEmail) {
            return yield getUniqueRandomEmail()
        } else {
            return email
        }
    }
}

function* createUserDevices(currUser, notificationId) {
    if (currUser.devices == undefined || currUser.devices == null) {
        currUser.devices = []
    }

    if (isUserDeviceExisting(currUser.devices, notificationId) == false) {
        var device = yield Device.findOneOrCreate({notificationId: notificationId}, {
            notificationId: notificationId,
            notificationsEnabled: true
        });
        currUser.devices.push(device)
        yield currUser.save()
    }
}

export function* getAnonymous() {
    return yield Anonymous.find({}).exec()
}

function* getUniqueRandomEmail() {
    let isExistingEmail = false
    var text;
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    do {
        text = "";
        for (var i = 0; i < 9; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        text += "@anonymous.com"

        isExistingEmail = yield User.findOne({email: text}).exec()
    } while (isExistingEmail)

    return text;
}

function postTweet(user) {
    var bolt = new Bolt(CONFIG.BOLT_APP_ID)
    var tweetComposer = new TweetComposer(CONFIG.APP_HUNT_TWITTER_HANDLE)
    var tweetOptions = {
        username: user.username,
        hashTags: ["app"]
    }

    bolt.postTweet(tweetComposer.composeWelcomeTweet(tweetOptions))
}

function followUser(user) {
    var bolt = new Bolt(CONFIG.BOLT_APP_ID)
    bolt.followUsers([user.username])
}

export function* update(userId, notificationId) {
    var user = yield User.findById(userId).populate('devices').exec();
    if (user == null) {
        return Boom.notFound('User not found!')
    }

    if (isUserDeviceExisting(user.devices, notificationId) == false) {
        var device = yield Device.findOneOrCreate({notificationId: notificationId}, {
            notificationId: notificationId,
            notificationsEnabled: true
        })
        user.devices.push(device)
    } else {
        return Boom.conflict('Existing user device!')
    }
    user.loginType = user.loginType.toLowerCase()
    user.save(function (err) {
        if (err) {
            console.log(err)
        }
    })
    return Boom.OK()
}

function isUserDeviceExisting(devices, notificationId) {
    var isDeviceIdExisting = false;
    for (var i = 0; i < devices.length; i++) {
        var currentDevice = devices[i]
        if (currentDevice.notificationId == notificationId) {
            isDeviceIdExisting = true;
            break;
        }
    }

    return isDeviceIdExisting;
}