var models = require("../models")
var AppsCollection = models.AppsCollection
var User = models.User

function* create(appsCollection, userId) {
    console.log(appsCollection)
    //var user = yield User.findById(userId}).exec()
}

module.exports.create = create