var Mongoose = require('mongoose')
var Notification = require('../models').Notification

function* create(message, type, sendTime) {
    return yield Notification.create({message: message, type: type, sendTime: sendTime });
}

function getAll() {

}

module.exports.create = create