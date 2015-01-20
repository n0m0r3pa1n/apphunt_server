var Mongoose = require('mongoose')
var App = require('../models').App
var User = require('../models').User

function* create(app, email) {
    var existingApp = yield App.findOne({package: app.package}).exec()
    if(existingApp) {
        return {statusCode: 409, message: "App already exists"}
    }

    var user = yield User.findOne({email: email}).exec()
    if(user) {
        app.createdBy = user
        yield App.create(app)
    } else {
        return {statusCode: 400}
    }
}

function* getAll() {
    return yield App.find({}).exec();
}

module.exports.create = create
module.exports.getAll = getAll
