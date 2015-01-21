var Mongoose = require('mongoose')
var App = require('../models').App
var User = require('../models').User
var Vote = require('../models').Vote
var AppCategory = require('../models').AppCategory
var Moment = require("moment-timezone")

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

function* getApps(date, page, pageSize) {
    var d = new Date(date);
    console.log(d)
    var nextDay = new Date(d.getTime() + (24 * 60 * 60 * 1000));
    console.log(nextDay)

    var apps = yield App.find({createdAt: {"$gte": d, "$lt": nextDay}}).exec()
    console.log(apps)
    return apps
}

module.exports.create = create
module.exports.getAll = getAll
module.exports.createVote = createVote
module.exports.getApps = getApps
