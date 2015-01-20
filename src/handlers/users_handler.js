var Mongoose = require('mongoose')
var User = require('../models').User

function* create(user) {
    yield User.findOneOrCreate({email: user.email}, user);
}

function* getAll() {
    return yield User.find({}).exec();
}

module.exports.create = create
module.exports.getAll = getAll
