var Mongoose = require('mongoose')
var Notification = require('../models').Notification

function* create(notification) {
    return yield Notification.create(notification);
}

function* get(type) {
    return yield Notification.findOne({type: type}).exec();
}

function* getAll() {
    return yield Notification.find({}).exec();
}

module.exports.create = create
module.exports.get = get
module.exports.getAll = getAll