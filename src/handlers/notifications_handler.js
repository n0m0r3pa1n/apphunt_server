var Mongoose = require('mongoose')
var Bolt = require("bolt-js")

var Notification = require('../models').Notification
var boltAppId = require('../config').boltAppId

function* create(notification) {
    return yield Notification.create(notification);
}

function* get(type) {
    return yield Notification.findOne({type: type}).exec();
}

function* getAll() {
    return yield Notification.find({}).exec();
}

function sendNotificationToUser(user, title, message, type) {
    if(user.populated('devices') == undefined) {
        console.log('Devices for users are not populated!');
        return;
    }

    var deviceIds = []
    for(var i=0; i<user.devices.length; i++) {
        var device = user.devices[i];
        deviceIds.push(device.deviceId)
    }
    if(deviceIds.length > 0) {
        sendNotification(deviceIds, title, message, type)
    }
}

function sendNotification(deviceIds, title, message, type) {
    var bolt = new Bolt(boltAppId)
    var notification = {
        deviceIds: deviceIds,
        data: {
            title: title,
            message: message,
            type: type
        }
    }

    if(deviceIds.length > 0 && deviceIds !== null) {
        console.log('Sending notification to ' + deviceIds)
        bolt.sendNotification(notification)
    }
}

module.exports.create = create
module.exports.get = get
module.exports.getAll = getAll
module.exports.sendNotification = sendNotification
module.exports.sendNotificationToUser = sendNotificationToUser