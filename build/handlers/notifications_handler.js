'use strict';

var Bolt = require('bolt-js');

var Notification = require('../models').Notification;
var User = require('../models').User;
var boltAppId = require('../config/config').BOLT_APP_ID;

function* create(notification) {
    return yield Notification.create(notification);
}

function* get(type) {
    return yield Notification.findOne({ type: type }).exec();
}

function* getAll() {
    return yield Notification.find({}).exec();
}

function* sendNotificationToUser(user, title, message, image, type) {
    if (user.populated('devices') == undefined) {
        try {
            user = yield User.findOne(user).populate('devices').exec();
            if (user.populated('devices') == undefined) {
                console.log('Could not populate user devices!');
                return;
            }
        } catch (e) {
            console.log(e);
            console.log('Devices for users are not populated!');
            return;
        }
    }
    var deviceIds = [];
    for (var i = 0; i < user.devices.length; i++) {
        var device = user.devices[i];
        deviceIds.push(device.notificationId);
    }
    if (deviceIds.length > 0) {
        sendNotification(deviceIds, title, message, image, type);
    }
}

function sendNotification(deviceIds, title, message, image, type) {
    var bolt = new Bolt(boltAppId);
    var notification = {
        deviceIds: deviceIds,
        data: {
            title: title,
            message: message,
            image: image,
            type: type
        }
    };

    if (deviceIds.length > 0 && deviceIds !== null) {
        bolt.sendNotification(notification);
    }
}

module.exports.create = create;
module.exports.get = get;
module.exports.getAll = getAll;
module.exports.sendNotification = sendNotification;
module.exports.sendNotificationToUser = sendNotificationToUser;