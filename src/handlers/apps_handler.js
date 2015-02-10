var Mongoose = require('mongoose')
var App = require('../models').App
var User = require('../models').User
var Vote = require('../models').Vote
var Badboy = require('badboy')
var AppCategory = require('../models').AppCategory
var appStatuses = require('../config').appStatuses
var appStatusesFilter = require('../config').appStatusesFilter
var UrlsHandler = require('./urls_handler')
var STATUS_CODES = require('../config').STATUS_CODES
var platforms = require('../config').platforms
var _ = require("underscore")


var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

function* create(app, userId) {

    var existingApp = yield App.findOne({package: app.package }).exec()
    if (existingApp) {
        return {statusCode: STATUS_CODES.CONFLICT, message: "App already exists"}
    }

    var parsedApp = {}
    try {
        if(app.platform == platforms.Android) {
            parsedApp = yield Badboy.getAndroidApp(app.package)
        } else {
            parsedApp = yield Badboy.getiOSApp(app.package)
        }
    } catch (e) {
        console.log("EXCEPTION")
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

    app.status = appStatuses.WAITING
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
    return createdApp
}

function* update(app) {
    var existingApp = yield App.findOne({package: app.package }).exec()
    if(!existingApp) {
        return {statusCode: STATUS_CODES.NOT_FOUND, message: "App does not exist"}
    }

    existingApp.createdAt = app.createdAt
    existingApp.description = app.description
    existingApp.status = app.status

    return yield existingApp.save()

}

function* deleteApp(package) {
    yield App.remove({package: package}).exec()

    return {
        statusCode: STATUS_CODES.OK
    }
}

function* getAll() {
    return yield App.find({}).exec();
}

function* createVote(userId, appId) {
    var user = yield User.findById(userId).exec()

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if(!app) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }

    for(var i=0; i< app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if(currUserId == userId) {
            return {statusCode: STATUS_CODES.NOT_FOUND}
        }
    }
    var vote = new Vote()
    vote.user = user

    vote = yield vote.save()
    app.votes.push(vote)

    yield app.save()
    return {
        statusCode:  STATUS_CODES.OK,
        votesCount: app.votes.length
    }
}

function* deleteVote(userId, appId) {
    var user = yield User.findById(userId).exec()

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if(!app) {

        return {statusCode: STATUS_CODES.NOT_FOUND}
    }
    for(var i=0; i< app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if(currUserId == userId) {
            app.votes.splice(i, 1);
        }
    }

    yield app.save()
    var appVotes = app.votes !== undefined && app.votes !== null ? app.votes.length : 0;
    return {
        votesCount: appVotes
    }
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

    if(appStatus !== appStatusesFilter.ALL) {
        where.status = appStatus
    }

    var query = App.find(where).populate("votes").populate("categories")

    if(page != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize)
    }

    var apps = yield query.exec()
    var resultApps = addVotesCount(apps)

    if(userId !== undefined) {
        setHasVoted(resultApps, userId)
    }

    var allAppsCount = yield App.count(where).exec()

    removeVotesField(resultApps)

    var response = {
        apps: resultApps,
        date: responseDate,
        totalCount: allAppsCount,
        page: page
    }
    if(page != 0 && pageSize != 0) {
        response.totalPages = Math.ceil(allAppsCount % pageSize)
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
    //var nonExistingApps = []
    //for(var i = 0; i < appsToBeAdded.length; i++) {
    //    try {
    //        if (platform == platforms.Android) {
    //            var app = yield Badboy.getAndroidApp(appsToBeAdded[i])
    //        } else {
    //            var app = yield Badboy.getiOSApp(appsToBeAdded[i])
    //        }
    //    } catch (e) {
    //        nonExistingApps.push(appsToBeAdded[i])
    //    }
    //}
    //var availablePackages = _.difference(appsToBeAdded, nonExistingApps)
    var existing = _.intersection(packages. existingAppsPackages)
    return {"availablePackages": appsToBeAdded, "existingPackages": existingAppsPackages }
}


//==========================================================
// Helper functions
//==========================================================
function addVotesCount(apps) {
    var resultApps = []

    for (var i = 0; i < apps.length; i++) {
        var app = apps[i].toObject()
        app.votesCount = app.votes.length
        resultApps.push(app)
    }
    return resultApps
}

function setHasVoted(apps, userId) {
    for (var i = 0; i < apps.length; i++) {
        var app = apps[i]
        app.hasVoted = hasVoted(app, userId)
    }
}

function hasVoted(app, userId) {
    var hasVoted = false
    for (var j = 0; j < app.votes.length; j++) {
        if (userId == app.votes[j].user) {
            hasVoted = true;
            break;
        }
    }
    return hasVoted
}

function removeVotesField(apps) {
    for(var i=0; i<apps.length; i++) {
        delete apps[i].votes
    }
}

module.exports.create = create
module.exports.getApps = getApps
module.exports.getAll = getAll
module.exports.update = update
module.exports.deleteApp = deleteApp
module.exports.filterApps = filterApps
module.exports.createVote = createVote
module.exports.deleteVote = deleteVote

