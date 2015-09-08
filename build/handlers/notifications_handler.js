'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.create = create;
exports.get = get;
exports.getAll = getAll;
exports.sendNotifications = sendNotifications;
exports.getNotificationTypes = getNotificationTypes;
var Bolt = require('bolt-js');

var Notification = require('../models').Notification;
var User = require('../models').User;
var Config = require('../config/config');
var _ = require('underscore');

function* create(notification) {
    return yield Notification.create(notification);
}

function* get(type) {
    return yield Notification.findOne({ type: type }).exec();
}

function* getAll() {
    return yield Notification.find({}).exec();
}

function* sendNotifications(devices, title, message, image, type) {
    if (devices == undefined || devices == null || devices.length == 0) {
        return;
    }

    var deviceIds = [];
    for (var i = 0; i < devices.length; i++) {
        var device = devices[i];
        deviceIds.push(device.notificationId);
    }

    var bolt = new Bolt(Config.BOLT_APP_ID);
    var notification = createNotification(deviceIds, title, message, image, type);
    bolt.sendNotification(notification);
}

function createNotification(deviceIds, title, message, image, type) {
    return {
        deviceIds: deviceIds,
        data: {
            title: title,
            message: message,
            image: image,
            type: type
        }
    };
}

function getNotificationTypes() {
    return _.values(Config.NOTIFICATION_TYPES);
}