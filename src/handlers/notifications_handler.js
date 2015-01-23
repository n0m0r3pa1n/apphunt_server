var Mongoose = require('mongoose')
var Notification = require('../models').Notification

function* create(message, type, sendTime) {
    return yield Notification.create({message: message, type: type, sendTime: sendTime });
}

function getAll() {
    return yield Notification.find({}).exec();
}

module.exports.create = create