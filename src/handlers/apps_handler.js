var DevsHunter = require('./utils/devs_hunter_handler')
var Badboy = require('badboy')
var _ = require("underscore")
var Bolt = require("bolt-js")
var TweetComposer = require('../utils/tweet_composer')
var CONFIG = require('../config/config')
var MESSAGES = require('../config/messages')

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

var STATUS_CODES = CONFIG.STATUS_CODES

var PLATFORMS = CONFIG.PLATFORMS
var BOLT_APP_ID = CONFIG.BOLT_APP_ID


var APP_STATUSES = CONFIG.APP_STATUSES
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER
var APP_HUNT_TWITTER_HANDLE = CONFIG.APP_HUNT_TWITTER_HANDLE
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES

var LOGIN_TYPES = CONFIG.LOGIN_TYPES

var VotesHandler = require('./votes_handler')
var UrlsHandler = require('./utils/urls_handler')
var CommentsHandler = require('./comments_handler')
var NotificationsHandler = require('./notifications_handler')
var EmailsHandler = require('./utils/emails_handler')

var DateUtils = require('../utils/date_utils')

var App = require('../models').App
var Developer = require('../models').Developer
var User = require('../models').User
var Vote = require('../models').Vote
var Comment = require('../models').Comment
var AppCategory = require('../models').AppCategory

function* create(app, userId) {
    app.package = getClearedAppPackage(app.package)

    var existingApp = yield App.findOne({package: app.package }).exec()
    if (existingApp) {
        return {statusCode: STATUS_CODES.CONFLICT, message: "App already exists"}
    }

    var parsedApp = {}
    try {
        if(app.platform == PLATFORMS.Android) {
            parsedApp = yield DevsHunter.getAndroidApp(app.package)
            if(parsedApp === null) {
                return { statusCode: STATUS_CODES.NOT_FOUND, message: "Non-existing app" }
            }

            var d = parsedApp.developer
            var developer = yield Developer.findOneOrCreate({email: d.email},{name: d.name, email: d.email})
            app.developer = developer
        } else {
            parsedApp = yield Badboy.getiOSApp(app.package)
        }
    } catch (e) {
        parsedApp = null
    }

    if(parsedApp == null) {
        return { statusCode: STATUS_CODES.NOT_FOUND, message: "Non-existing app" }
    }

    var user = yield User.findOne({_id: userId}).exec()

    app.status = APP_STATUSES.WAITING
    app.createdBy = user
    app.categories = yield getAppCategories(parsedApp)
    app.isFree = parsedApp.isFree
    app.icon = parsedApp.icon
    app.shortUrl = ''
    app.name = parsedApp.name
    app.url = parsedApp.url


    var parsedDescription = app.description;
    if(parsedDescription == '' || parsedDescription === undefined) {
        parsedDescription = parsedApp.description
        app.description = parsedDescription.length > 100 ?
            parsedDescription.substring(0,10) :
            parsedDescription;
    }

    var createdApp = yield App.create(app)
    var voteResponse = yield VotesHandler.createAppVote(userId, createdApp.id)

    return createdApp
}

function getClearedAppPackage(packageName) {
    var splitByAmpersandRegEx = /^.*(?=(\&))/
    var appPackage = packageName.match(splitByAmpersandRegEx);
    if(appPackage !== undefined && appPackage !== null && appPackage.length > 1) {
        packageName = appPackage[0]
    }

    return packageName
}

function* getAppCategories(parsedApp) {
    var appCategories = []
    for (var index in parsedApp.categories) {
        var category = yield AppCategory.findOneOrCreate({name: parsedApp.categories[index]}, {name: parsedApp.categories[index]})
        appCategories.push(category)
    }

    return appCategories
}

function* update(app) {
    var existingApp = yield App.findOne({package: app.package }).populate('developer createdBy').exec()
    if(!existingApp) {
        return {statusCode: STATUS_CODES.NOT_FOUND, message: "App does not exist"}
    }
    var isAppApproved = existingApp.status == APP_STATUSES.WAITING && app.status == APP_STATUSES.APPROVED;

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
    if(user.loginType !== LOGIN_TYPES.Fake) {
        tweetOptions.user = user.username
    }
    bolt.postTweet(tweetComposer.compose(tweetOptions))
}


function* deleteApp(package) {
    var app = yield App.findOne({package: package}).exec()
    yield VotesHandler.clearAppVotes(app.votes)
    yield CommentsHandler.clearAppComments(app._id)

    yield App.remove({package: package}).exec()

    return {
        statusCode: STATUS_CODES.OK
    }
}

function* changeAppStatus(appPackage, status) {
    var app = yield App.findOne({package: appPackage}).exec()
    if(app == null) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }
    var createdBy = yield User.findOne(app.createdBy).populate('devices').exec()
    if(status === APP_STATUSES.REJECTED) {
        var title = String.format(MESSAGES.APP_REJECTED_TITLE, app.name)
        var message = MESSAGES.APP_REJECTED_MESSAGE
        yield NotificationsHandler.sendNotificationToUser(createdBy, title, message, app.icon,
            NOTIFICATION_TYPES.APP_REJECTED)

        yield deleteApp(appPackage)
    } else if(status == APP_STATUSES.APPROVED){
        var isAppApproved = app.status == APP_STATUSES.WAITING && status == APP_STATUSES.APPROVED;
        if(isAppApproved) {
            app.shortUrl = yield UrlsHandler.getShortLink(app.url);

            postTweet(app, createdBy)
            EmailsHandler.sendEmailToDeveloper(app)

            var title = String.format(MESSAGES.APP_APPROVED_TITLE, app.name)
            var message = String.format(MESSAGES.APP_APPROVED_MESSAGE, app.name, DateUtils.formatDate(app.createdAt))

            yield NotificationsHandler.sendNotificationToUser(createdBy, title, message, app.icon, NOTIFICATION_TYPES.APP_APPROVED)
        }
    }


    app.status = status;
    yield app.save()

    return {statusCode: STATUS_CODES.OK}
}

function* getApps(dateStr, toDateStr, platform, appStatus, page, pageSize, userId) {

    var where = {};
    var responseDate = ""
    if(dateStr !== undefined) {
        var date = new Date(dateStr);
        var toDate = new Date(date.getTime() + DAY_MILLISECONDS);
        if(toDateStr !== undefined) {
            toDate = new Date(toDateStr + DAY_MILLISECONDS)
        }
        where = {createdAt: {"$gte": new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), "$lt": toDate.toISOString()}};
        responseDate += date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
    }

    where.platform = platform

    if(appStatus !== APP_STATUS_FILTER.ALL) {
        where.status = appStatus
    }

    var query = App.find(where).deepPopulate("votes.user").populate("categories").populate("createdBy")
    query.sort({ votesCount: 'desc', createdAt: 'desc' })

    if(page != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize)
    }

    var apps = yield query.exec()
    var resultApps = convertToArray(apps)

    if(userId !== undefined && resultApps !== undefined) {
        resultApps = VotesHandler.setHasUserVotedForAppField(resultApps, userId)
    }

    for(var i=0; i < resultApps.length; i++) {
        resultApps[i].commentsCount = yield setCommentsCount(resultApps[i]._id)
    }

    var allAppsCount = yield App.count(where).exec()

    removeUnusedFields(resultApps)

    var response = {
        apps: resultApps,
        date: responseDate,
        totalCount: allAppsCount,
        page: page
    }
    if(page != 0 && pageSize != 0 && allAppsCount > 0) {
        response.totalPages = Math.ceil(allAppsCount / pageSize)
    }
    return response
}

function* filterApps(packages, platform) {
    var existingApps = yield App.find( { package: { $in: packages } } ).exec()
    var existingAppsPackages = []
    for(var i in existingApps) {
        existingAppsPackages.push(existingApps[i].package)
    }

    var appsToBeAdded = _.difference(packages, existingAppsPackages)
    return {"availablePackages": appsToBeAdded, "existingPackages": existingAppsPackages }
}

function* getApp(appId, userId) {
    var app = yield App.findById(appId).deepPopulate('votes.user').populate('createdBy').exec()
    if(!app) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }

    if(userId !== undefined) {
        app = app.toObject()
        app.hasVoted = VotesHandler.hasUserVotedForApp(app, userId)
    }

    return app
}

function* searchApps(q, platform, status, page, pageSize, userId) {
    var where = {name: {$regex: q, $options: 'i'}};
    where.platform = platform;
    if(status !== undefined) {
        where.status = status;
    } else {
        where.status = APP_STATUSES.APPROVED;
    }

    var query = App.find(where).deepPopulate('votes.user').populate("categories").populate("createdBy")
    query.sort({ votesCount: 'desc', createdAt: 'desc' })

    if(page != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize)
    }

    var apps = yield query.exec()
    var resultApps = convertToArray(apps)

    if(userId !== undefined && resultApps !== undefined) {
        resultApps = VotesHandler.setHasUserVotedForAppField(resultApps, userId)
    }

    for(var i=0; i < resultApps.length; i++) {
        resultApps[i].commentsCount = yield setCommentsCount(resultApps[i]._id)
    }

    var allAppsCount = yield App.count(where).exec()
    removeUnusedFields(resultApps)

    var response = {
        apps: resultApps,
        totalCount: allAppsCount,
        page: page
    }

    if(page != 0 && pageSize != 0 && allAppsCount > 0) {
        response.totalPages = Math.ceil(allAppsCount / pageSize)
    }
    return response
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

module.exports.create = create
module.exports.getApps = getApps
module.exports.update = update
module.exports.deleteApp = deleteApp
module.exports.filterApps = filterApps
module.exports.getApp = getApp
module.exports.searchApps = searchApps
module.exports.changeAppStatus = changeAppStatus
