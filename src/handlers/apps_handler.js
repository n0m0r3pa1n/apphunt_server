var Badboy = require('badboy')
var _ = require("underscore")
var Bolt = require("bolt-js")

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
var STATUS_CODES = require('../config').STATUS_CODES

var PLATFORMS = require('../config').PLATFORMS
var BOLT_APP_ID = require('../config').BOLT_APP_ID

var APP_STATUSES = require('../config').APP_STATUSES
var APP_STATUS_FILTER = require('../config').APP_STATUSES_FILTER

var VotesHandler = require('./votes_handler')
var UrlsHandler = require('./urls_handler')
var CommentsHandler = require('./comments_handler')
var NotificationsHandler = require('./notifications_handler')
var EmailsHandler = require('./emails_handler')

var App = require('../models').App
var Developer = require('../models').Developer
var User = require('../models').User
var Vote = require('../models').Vote
var Comment = require('../models').Comment
var AppCategory = require('../models').AppCategory


function* create(app, userId) {

    var existingApp = yield App.findOne({package: app.package }).exec()
    if (existingApp) {
        return {statusCode: STATUS_CODES.CONFLICT, message: "App already exists"}
    }

    var parsedApp = {}
    try {
        if(app.platform == PLATFORMS.Android) {
            parsedApp = yield Badboy.getAndroidApp(app.package)
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

    var appCategories = []
    for (var index in parsedApp.categories) {
        var category = yield AppCategory.findOneOrCreate({name: parsedApp.categories[index]}, {name: parsedApp.categories[index]})
        appCategories.push(category)
    }

    var shortUrl = yield UrlsHandler.getShortLink(parsedApp.url)
    var user = yield User.findOne({_id: userId}).exec()

    app.status = APP_STATUSES.WAITING
    app.createdBy = user
    app.categories = appCategories
    app.isFree = parsedApp.isFree
    app.icon = parsedApp.icon
    app.name = parsedApp.name
    app.url = parsedApp.url
    app.shortUrl = shortUrl


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

    if(isAppApproved) {
        postTweet(savedApp, existingApp.createdBy)
        EmailsHandler.sendEmailToDeveloper(savedApp)

        var createdBy = yield User.findOne(createdBy).populate('devices').exec()
        //NotificationsHandler.sendNotificationToUser(createdBy, "Test title", "Test message", "app_approved")
    }
    return savedApp

}

function postTweet(app, user) {
    var bolt = new Bolt(BOLT_APP_ID)
    // fake user
    if(user.email.indexOf('@example.com') > 1) {
        
    } else {
        user.username
    }
    var message = app.description + " " + app.shortUrl + " #" + app.platform + " #new #app"
    bolt.postTweet(message)
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
    if(status === APP_STATUSES.REJECTED) {
        yield deleteApp(appPackage)
    } else if(status == APP_STATUSES.APPROVED){

        var isAppApproved = app.status == APP_STATUSES.WAITING && status == APP_STATUSES.APPROVED;
        if(isAppApproved) {
            postTweet(app)
            EmailsHandler.sendEmailToDeveloper(app)

            var createdBy = yield User.findOne(app.createdBy).populate('devices').exec()
            NotificationsHandler.sendNotificationToUser(createdBy, "Test title", "Test message", "app_approved")
        }
    }

    app.status = status;
    yield app.save()

    return {statusCode: STATUS_CODES.OK}
}

function* getApps(dateStr, platform, appStatus, page, pageSize, userId) {
    var where = {};
    var responseDate = ""
    if(dateStr !== undefined) {
        var date = new Date(dateStr);
        var nextDate = new Date(date.getTime() + DAY_MILLISECONDS);
        where = {createdAt: {"$gte": new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), "$lt": nextDate.toISOString()}};
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

function* searchApps(q, platform, page, pageSize, userId) {
    var where = {name: {$regex: q, $options: 'i'}};
    where.platform = platform;
    where.status = APP_STATUSES.APPROVED;

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
