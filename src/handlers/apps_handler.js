var Mongoose = require('mongoose')
var App = require('../models').App
var User = require('../models').User
var Vote = require('../models').Vote
var AppCategory = require('../models').AppCategory
var Moment = require("moment-timezone")

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

function* create(app, userId, categories) {
    var existingApp = yield App.findOne({package: app.package}).exec()
    if (existingApp) {
        return {statusCode: 409, message: "App already exists"}
    }

    var appCategories = []
    for (var index in categories) {
        var category = yield AppCategory.findOneOrCreate({name: categories[index]}, {name: categories[index]})
        appCategories.push(category)
    }

    var user = yield User.findOne({_id: userId}).exec()
    if(user) {
        app.createdBy = user
        app.categories = appCategories
        return yield App.create(app)
    } else {
        return {statusCode: 400}
    }
}

function* getAll() {
    return yield App.find({}).exec();
}

function* createVote(userId, appId) {
    var user = yield User.findById(userId).exec()
    if(!user) {
        return {statusCode: 400}
    }

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if(!app) {
        return {statusCode: 400}
    }

    for(var i=0; i< app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if(currUserId == userId) {
            return {statusCode: 400}
        }
    }
    var vote = new Vote()
    vote.user = user

    vote = yield vote.save()
    app.votes.push(vote)


    yield app.save()
}

function* deleteVote(userId, appId) {
    var user = yield User.findById(userId).exec()
    if(!user) {
        return {statusCode: 400}
    }

    var query = App.findById(appId)
    var app = yield query.populate("votes").exec()
    if(!app) {
        return {statusCode: 400}
    }

    for(var i=0; i< app.votes.length; i++) {
        var currUserId = app.votes[i].user
        if(currUserId == userId) {
            app.votes.remove(app.votes[i])
        }
    }

    yield app.save()
}


function* getApps(dateStr, page, pageSize, userId) {
    var where = {};
    if(date !== undefined) {
        var date = new Date(dateStr);
        var nextDate = new Date(date.getTime() + DAY_MILLISECONDS);
        where = {createdAt: {"$gte": date, "$lt": nextDate}};
    }

    var query = App.find(where).populate("votes")

    if(page != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((page - 1) * pageSize)
    }

    var apps = yield query.exec()
    var resultApps = addVotesCount(apps)

    if(userId !== undefined) {
        setHasVoted(resultApps, userId)
    }

    var allAppsCount = yield App.count({}).exec()
    var response = {
        apps: resultApps,
        totalCount: allAppsCount,
        page: page
    }
    if(page != 0 && pageSize != 0) {
        response.totalPages = Math.round(allAppsCount / pageSize)
    }

    return response
}

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
            hasVoted = true
            break
        }
    }
    return hasVoted
}

module.exports.create = create
module.exports.getAll = getAll
module.exports.createVote = createVote
module.exports.deleteVote = deleteVote
module.exports.getApps = getApps
