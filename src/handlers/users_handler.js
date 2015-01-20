var Mongoose = require('mongoose')
var User = require('../models').User

function* create(user) {
    yield User.findOneOrCreate({email: user.email}, user);
}

function* getAll() {
    return yield User.find({}).exec();
}

function* get(email) {
    return yield User.findOne({email: email});
}

module.exports.create = create
module.exports.getAll = getAll
