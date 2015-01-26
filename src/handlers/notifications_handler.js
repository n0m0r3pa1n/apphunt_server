var Mongoose = require('mongoose')
var Notification = require('../models').Notification

function* create(message, type, sendTime) {
    return yield Notification.create({message: message, type: type, sendTime: sendTime });
}

function* create(user) {
    return yield User.create(user);
}

function* getAll() {
    return yield Notification.find({}).exec();
}

module.exports.create = create