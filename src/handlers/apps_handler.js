var Mongoose = require('mongoose')
var App = require('../models').App
var User = require('../models').User
var Vote = require('../models').Vote

function* create(app, userId) {
    var existingApp = yield App.findOne({package: app.package}).exec()
    if(existingApp) {
        return {statusCode: 409, message: "App already exists"}
    }

    var user = yield User.findOne({_id: userId}).exec()
    if(user) {
        app.createdBy = user
        return yield App.create(app)
    } else {
        return {statusCode: 400}
    }
}

function* getAll() {
    return yield App.find({}).exec();
}

function* createVote(userId, appId) {
    var user = yield User.findOne({_id: userId}).exec()
    if(!user) {
        return {statusCode: 400}
    }

    var app = yield App.findOne({_id: appId}).populate("votes").exec()
    if(!app) {
        return {statusCode: 400}
    }

    console.log("UserId: " + userId)
    console.log("Votes: " + app.votes);
    //for(v in app.votes) {
    //    var currUserId = v.user
    //    console.log("CurrIserId: " + v);
    //    if(currUserId == userId) {
    //        console.log("IFFFFF");
    //        return {statusCode: 400}
    //    }
    //}

    var vote = new Vote()
    vote.user = user
    vote = yield vote.save()

    app.votes.push(vote)
    yield app.save()
}

module.exports.create = create
module.exports.getAll = getAll
module.exports.createVote = createVote
