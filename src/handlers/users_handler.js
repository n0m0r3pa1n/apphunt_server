var Mongoose = require('mongoose')
var User = require('../models').User

function* create(advertisingId) {
    yield User.findOneOrCreate({advertisingId: advertisingId}, {advertisingId: advertisingId});
}

function* getAll() {
    return yield User.find({}).exec();
}

module.exports.create = create
module.exports.getAll = getAll
