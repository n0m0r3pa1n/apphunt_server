var Bolt = require("bolt-js")
var _ = require('underscore')
var Boom = require('boom')

var Notification = require('../models').Notification
var Config = require('../config/config')

import * as UsersHandler from './users_handler.js'

export function* create(notification) {
    return yield Notification.create(notification);
}

export function* get(type) {
    return yield Notification.findOne({type: type}).exec();
}

export function* getAll() {
    return yield Notification.find({}).exec();
}

export function* sendNotificationsToUsers(userIds, title, message, image, type) {
    let devices = []
    if(userIds.length == 0) {
        devices = yield UsersHandler.getDevicesForAllUsers()
    } else {
        for(let userId of userIds) {
            let userDevices = yield UsersHandler.getUserDevices(userId)
            devices = devices.concat(userDevices)
        }
    }

    sendNotifications(devices, title, message, image, type)

    return Boom.OK()
}

export function sendNotifications(devices, title, message, image, type, data) {
    if(devices == undefined || devices == null || devices.length == 0) {
        return
    }

    var deviceIds = []
    for(var i=0; i<devices.length; i++) {
        var device = devices[i];
        deviceIds.push(device.notificationId)
    }

    var bolt = new Bolt(Config.BOLT_APP_ID)
    var notification = createNotification(deviceIds, title, message, image, type, data);
    bolt.sendNotification(notification)
}

function createNotification(deviceIds, title, message, image, type, data) {
    if(data == undefined) {
        data = {}
    }
    return {
        deviceIds: deviceIds,
        data: {
            title: title,
            message: message,
            image: image,
            type: type,
            data: data
        }
    }
}

export function getNotificationTypes() {
    return _.values(Config.NOTIFICATION_TYPES)
}