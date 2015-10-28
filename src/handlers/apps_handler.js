var DevsHunter = require('./utils/devs_hunter_handler')
var Badboy = require('badboy')
var _ = require("underscore")
var Bolt = require("bolt-js")
var Boom = require('boom')
var TweetComposer = require('../utils/tweet_composer')
var CONFIG = require('../config/config')
var MESSAGES = require('../config/messages')

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

var PLATFORMS = CONFIG.PLATFORMS
var BOLT_APP_ID = CONFIG.BOLT_APP_ID


var APP_STATUSES = CONFIG.APP_STATUSES
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER
var APP_HUNT_TWITTER_HANDLE = CONFIG.APP_HUNT_TWITTER_HANDLE
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES

var LOGIN_TYPES = CONFIG.LOGIN_TYPES
var LOGIN_TYPES_FILTER = CONFIG.LOGIN_TYPES_FILTER

var VotesHandler = require('./votes_handler')
var UrlsHandler = require('./utils/urls_handler')
var CommentsHandler = require('./comments_handler')
var EmailsHandler = require('./utils/emails_handler')
import * as HistoryHandler from './history_handler.js'
import * as PaginationHandler from './pagination_handler.js'
import * as TagsHandler from './tags_handler.js'
import * as NotificationsHandler from './notifications_handler.js'
import * as FollowersHandler from './followers_handler.js'
import * as UsersHandler from './users_handler.js'
var DateUtils = require('../utils/date_utils')

var Models = require('../models')
var App = Models.App
var Developer = Models.Developer
var User = Models.User
var AppCategory = Models.AppCategory

export function* create(app, tags, userId) {
    app.package = getClearedAppPackage(app.package)

    var existingApp = yield App.findOne({package: app.package}).exec()
    if (existingApp) {
        return Boom.conflict('App already exists')
    }

    var parsedApp = {}
    try {
        if (app.platform == PLATFORMS.Android) {
            parsedApp = yield DevsHunter.getAndroidApp(app.package)
            if (parsedApp === null) {
                return Boom.notFound("Non-existing app")
            }

            var d = parsedApp.developer
            var developer = yield Developer.findOneOrCreate({email: d.email}, {name: d.name, email: d.email})
            app.developer = developer
        } else {
            parsedApp = yield Badboy.getiOSApp(app.package)
            parsedApp.category = parsedApp.categories == null || parsedApp.categories == undefined
            || parsedApp.categories.length == 0 ? "" : parsedApp.categories[0]
        }
    } catch (e) {
        parsedApp = null
    }

    if (parsedApp == null) {
        return Boom.notFound("Non-existing app")
    }

    var user = yield User.findOne({_id: userId}).exec()
    if (user == null) {
        return Boom.notFound("Non-existing user")
    }

    app.status = APP_STATUSES.WAITING
    app.createdBy = user
    app.categories = yield getAppCategories(parsedApp.category)
    app.isFree = parsedApp.isFree
    app.icon = parsedApp.icon
    app.shortUrl = ''
    app.name = parsedApp.name
    app.url = parsedApp.url

    if (app.platform == PLATFORMS.Android) {
        app.screenshots = parsedApp.screenshots
        app.averageScore = parsedApp.score.total == undefined ? 0 : parsedApp.score.total
    }


    var parsedDescription = app.description;
    if (parsedDescription == '' || parsedDescription === undefined) {
        parsedDescription = parsedApp.description
        app.description = parsedDescription.length > 100 ?
            parsedDescription.substring(0, 10) :
            parsedDescription;
    }

    var createdApp = yield App.create(app)
    yield VotesHandler.createAppVote(userId, createdApp.id)
    yield TagsHandler.saveTagsForApp(tags, createdApp.id, createdApp.name, [getFormattedCategory(parsedApp.category)])

    return createdApp
}


function getClearedAppPackage(packageName) {
    var splitByAmpersandRegEx = /^.*(?=(\&))/
    var appPackage = packageName.match(splitByAmpersandRegEx);
    if (appPackage !== undefined && appPackage !== null && appPackage.length > 1) {
        packageName = appPackage[0]
    }

    return packageName
}

function* getAppCategories(appCategories) {
    let categoryName = getFormattedCategory(appCategories);
    let categories = []
    var category = yield AppCategory.findOneOrCreate({name: categoryName}, {name: categoryName})
    categories.push(category)

    return categories
}

function getFormattedCategory(category) {
    var res = category.split("/");

    var newCategory = res[res.length - 1].toLowerCase();
    newCategory = newCategory.capitalizeFirstLetter()
    newCategory = newCategory.replace('and', '&')
    newCategory = newCategory.replaceAll('_', ' ')

    let finalCategory = newCategory;

    let split = newCategory.split(' ')
    if (split.length > 1) {
        finalCategory = "";
        for (let i = 0; i < split.length; i++) {
            let part = split[i]
            if (i == split.length - 1) {
                finalCategory += part.capitalizeFirstLetter();
            } else {
                if (part === "Game") {
                    continue;
                }
                finalCategory += part.capitalizeFirstLetter() + " ";
            }
        }
    }

    return finalCategory;
}

function* getPopulatedApp(app, userId) {
    app = app.toObject()
    app.isFavourite = false;
    if (userId !== undefined) {
        app.hasVoted = VotesHandler.hasUserVotedForApp(app, userId)
        for (let favouritedBy of app.favouritedBy) {
            if (String(favouritedBy) == String(userId)) {
                app.isFavourite = true;
                break;
            }
        }
    }

    let categories = []
    for (let category of app.categories) {
        categories.push(category.name)
    }

    app.tags = yield TagsHandler.getTagsForApp(app._id)
    app.categories = categories

    return app;
}
export function* getRandomApp(userId) {
    let count = yield App.count()
    let rand = Math.floor(Math.random() * count);

    let app = yield App.findOne().deepPopulate('votes.user').populate('createdBy categories').skip(rand).exec()
    return yield getPopulatedApp(app, userId);
}

export function* update(app) {
    var existingApp = yield App.findOne({package: app.package}).populate('developer createdBy').exec()
    if (!existingApp) {
        return Boom.notFound("Non-existing app")
    }

    existingApp.createdAt = app.createdAt
    existingApp.description = app.description
    existingApp.status = app.status

    var savedApp = yield existingApp.save()
    return savedApp

}

function postTweet(app, user) {
    var bolt = new Bolt(BOLT_APP_ID)
    var tweetComposer = new TweetComposer(APP_HUNT_TWITTER_HANDLE)
    var tweetOptions = {
        name: app.name,
        description: app.description,
        url: app.shortUrl,
        hashTag: "app"
    }
    if (user.loginType == LOGIN_TYPES.Twitter) {
        tweetOptions.user = user.username
    }

    bolt.postTweet(tweetComposer.compose(tweetOptions))
}


export function* deleteApp(packageName) {
    var app = yield App.findOne({package: packageName}).exec()
    yield VotesHandler.clearAppVotes(app.votes)
    yield CommentsHandler.clearAppComments(app._id)
    yield TagsHandler.removeAppFromTags(app._id)
    yield App.remove({package: packageName}).exec()

    return Boom.OK()
}

export function* changeAppStatus(appPackage, status) {
    var app = yield App.findOne({package: appPackage}).exec()
    if (app == null) {
        return Boom.notFound("Non-existing app")
    }
    var createdBy = yield User.findOne(app.createdBy).populate('devices').exec()
    var devices = createdBy.devices

    if (status === APP_STATUSES.REJECTED) {
        var title = String.format(MESSAGES.APP_REJECTED_TITLE, app.name)
        var message = MESSAGES.APP_REJECTED_MESSAGE
        NotificationsHandler.sendNotifications(devices, title, message, app.icon, NOTIFICATION_TYPES.APP_REJECTED)
        yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_REJECTED, createdBy._id, {appName: app.name})
        yield deleteApp(appPackage)
    } else if (status == APP_STATUSES.APPROVED) {
        var isAppApproved = app.status == APP_STATUSES.WAITING && status == APP_STATUSES.APPROVED;

        if (isAppApproved) {
            yield setAppShortUrl(app);
            postTweet(app, createdBy)
            EmailsHandler.sendEmailToDeveloper(app)

            let title = String.format(MESSAGES.APP_APPROVED_TITLE, app.name)
            let message = String.format(MESSAGES.APP_APPROVED_MESSAGE, app.name, DateUtils.formatDate(app.createdAt))
            NotificationsHandler.sendNotifications(devices, title, message, app.icon, NOTIFICATION_TYPES.APP_APPROVED)
            yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_APPROVED, createdBy._id, {
                appId: app._id,
                appName: app.name
            })

            yield sendNotificationsToFollowers(createdBy, app.name, app.icon);
        }
    }


    app.status = status;
    yield app.save()

    return Boom.OK()
}

function* sendNotificationsToFollowers(createdBy, appName, icon) {
    let followers = (yield FollowersHandler.getFollowers(createdBy._id)).followers
    let devices = []
    for (let follower of followers) {
        devices = devices.concat(yield UsersHandler.getDevicesForUser(follower._id))
    }

    let message = String.format(MESSAGES.FOLLOWING_APP_APPROVED_MESSAGE, appName)
    let title = String.format(MESSAGES.FOLLOWER_APP_APPROVED_TITLE, createdBy.name)
    NotificationsHandler.sendNotifications(devices, title, message, icon, NOTIFICATION_TYPES.FOLLOWING_ADDED_APP)
}

function* setAppShortUrl(app) {
    var links = [{
        url: app.url, platform: "default"
    }]

    if (app.platform == PLATFORMS.Android) {
        links.push({
            url: "market://details?id=" + app.package,
            platform: "android"
        })
    }
    app.shortUrl = yield UrlsHandler.getShortLink(links)
}

export function* getApps(dateStr, toDateStr, platform, appStatus, page, pageSize, userId, userType, query) {
    var where = {};

    if (query !== undefined) {
        where.name = {$regex: query, $options: 'i'};
    }

    var responseDate = ""
    if (dateStr !== undefined) {
        var date = new Date(dateStr);
        var toDate = new Date(date.getTime() + DAY_MILLISECONDS);
        if (toDateStr !== undefined) {
            var toDateFromString = new Date(toDateStr)
            toDate = new Date(toDateFromString.getTime() + DAY_MILLISECONDS)
        }
        where.createdAt = {
            "$gte": new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
            "$lt": toDate.toISOString()
        };
        responseDate += date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
    }

    where.platform = platform

    if (appStatus !== APP_STATUS_FILTER.ALL) {
        where.status = appStatus
    }

    var query = App.find(where).deepPopulate("votes.user").populate("categories").populate("createdBy")
    query.sort({votesCount: 'desc', createdAt: 'desc'})

    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "apps", page, pageSize)
    result.apps = convertToArray(result.apps)
    if (userType != undefined) {
        for (let app of result.apps) {
            app.votes = getAppVotesForUserType(app.votes, userType)
            app.votesCount = app.votes.length
        }
        result.apps = _.sortBy(result.apps, 'votesCount')
        result.apps.reverse()
    }
    yield formatApps(userId, result.apps);

    result.date = responseDate

    return result
}

function getAppVotesForUserType(userVotes, userType) {
    return _.filter(userVotes, function (vote) {
        let pass = false;
        if (userType == LOGIN_TYPES_FILTER.Fake) {
            pass = vote.user.loginType == LOGIN_TYPES.Fake ? true : false
        } else if (userType == LOGIN_TYPES_FILTER.Real) {
            pass = vote.user.loginType != LOGIN_TYPES.Fake ? true : false
        } else {
            pass = true
        }
        return pass
    })
}

export function* getAppsForUser(creatorId, userId = creatorId, page = 0, pageSize = 0) {
    var query = App.find({
        createdBy: creatorId,
        status: APP_STATUSES.APPROVED
    }).deepPopulate("votes.user").populate("categories").populate("createdBy")
    query.sort({votesCount: 'desc', createdAt: 'desc'})
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "apps", page, pageSize)
    result.apps = convertToArray(result.apps)
    yield formatApps(userId, result.apps);

    return result
}

export function* filterApps(packages, platform) {
    var existingApps = yield App.find({package: {$in: packages}}).exec()
    var existingAppsPackages = []
    for (var i in existingApps) {
        existingAppsPackages.push(existingApps[i].package)
    }

    var appsToBeAdded = _.difference(packages, existingAppsPackages)
    let packagesResult = []
    for (let app of appsToBeAdded) {
        let parsedApp = null
        try {
            parsedApp = yield DevsHunter.getAndroidApp(app)
        } catch (e) {
            continue;
        }

        if (parsedApp != null) {
            packagesResult.push(app)
        }
    }
    return {"availablePackages": packagesResult, "existingPackages": existingAppsPackages}
}

export function* getApp(appId, userId) {
    var app = yield App.findById(appId).deepPopulate('votes.user').populate('createdBy categories').exec()
    if (!app) {
        return Boom.notFound('App can not be found!')
    }

    return yield getPopulatedApp(app, userId)
}

export function* getFavouriteAppsCount(userId) {
    return yield App.count({favouritedBy: userId}).exec()
}


export function* searchApps(q, platform, status, page, pageSize, userId) {
    var where = {name: {$regex: q, $options: 'i'}};
    where.platform = platform;
    if (status !== undefined) {
        where.status = status;
    } else {
        where.status = APP_STATUSES.APPROVED;
    }

    var query = App.find(where).deepPopulate('votes.user').populate("categories").populate("createdBy")
    query.sort({votesCount: 'desc', createdAt: 'desc'})

    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "apps", page, pageSize);
    result.apps = convertToArray(result.apps)
    yield formatApps(userId, result.apps);
    return result
}

export function* favourite(appId, userId) {
    var app = yield App.findById(appId).exec()
    if (!app) {
        return Boom.notFound('App cannot be found!')
    }

    let user = yield User.findById(userId).exec()
    if (user == null) {
        return Boom.notFound('User cannot be found!')
    }

    for (let favouritedBy in app.favouritedBy) {
        if (favouritedBy == userId) {
            return Boom.conflict("User has already favourited app!");
        }
    }
    app.favouritedBy.push(userId);
    yield app.save()

    yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_FAVOURITED, userId, {
        appId: app._id,
        appName: app.name,
        userName: user.name
    })
    let isFollowing = yield FollowersHandler.isFollowing(app.createdBy, userId)
    if (isFollowing) {
        let title = "Check this cool app"
        let messages = HistoryHandler.getText(HISTORY_EVENT_TYPES.APP_FAVOURITED, {
            appName: app.name,
            userName: user.name
        })
        yield NotificationsHandler.sendNotificationsToUsers([app.createdBy], title, messages, app.icon, NOTIFICATION_TYPES.FOLLOWING_FAVOURITED_APP, {
            appId: app._id
        })
    }

    return Boom.OK();
}

export function* unfavourite(appId, userId) {
    var app = yield App.findById(appId).exec()
    if (!app) {
        return Boom.notFound('App cannot be found!')
    }

    var size = app.favouritedBy.length;
    for (let i = 0; i < size; i++) {
        let currentFavouritedId = app.favouritedBy[i]
        if (currentFavouritedId == userId) {
            app.favouritedBy.splice(i, 1);
            break;
        }
    }

    yield app.save()

    return Boom.OK();
}

export function* getFavouriteApps(creatorId, userId, page, pageSize) {
    var query = App.find({favouritedBy: creatorId})
        .deepPopulate('votes.user').populate("categories").populate("createdBy")

    let result = yield PaginationHandler.getPaginatedResultsWithName(query, "apps", page, pageSize)
    result.apps = convertToArray(result.apps)
    yield formatApps(userId, result.apps);
    return result
}

//==========================================================
// Helper functions
//==========================================================
function removeUnusedFields(apps) {
    if (apps !== undefined) {
        for (var i = 0; i < apps.length; i++) {
            delete apps[i].votes
        }
    }
}

function* setCommentsCount(appId) {
    return yield CommentsHandler.getCount(appId)
}

function convertToArray(apps) {
    var resultApps = []
    for (var i = 0; i < apps.length; i++) {
        var app = apps[i].toObject()
        resultApps.push(app)
    }

    return resultApps;
}

function* formatApps(userId, apps) {
    if (userId !== undefined && apps !== undefined) {
        apps = VotesHandler.setHasUserVotedForAppField(apps, userId)
    }

    for (var i = 0; i < apps.length; i++) {
        apps[i].commentsCount = yield setCommentsCount(apps[i]._id)
        let categories = []
        for (let category of apps[i].categories) {
            categories.push(category.name)
        }
        apps[i].categories = categories
    }

    removeUnusedFields(apps)
}