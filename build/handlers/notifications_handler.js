'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.create = create;
exports.get = get;
exports.getAll = getAll;
exports.sendNotificationsToUsers = sendNotificationsToUsers;
exports.sendNotifications = sendNotifications;
exports.getNotificationTypes = getNotificationTypes;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _users_handlerJs = require('./users_handler.js');

var UsersHandler = _interopRequireWildcard(_users_handlerJs);

var Bolt = require('bolt-js');

var Notification = require('../models').Notification;
var Config = require('../config/config');
var _ = require('underscore');
var Boom = require('boom');

function* create(notification) {
    return yield Notification.create(notification);
}

function* get(type) {
    return yield Notification.findOne({ type: type }).exec();
}

function* getAll() {
    return yield Notification.find({}).exec();
}

function* sendNotificationsToUsers(userIds, title, message, image, type) {
    var devices = [];
    if (userIds.length == 0) {
        devices = yield UsersHandler.getDevicesForAllUsers();
    } else {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = userIds[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var userId = _step.value;

                var userDevices = yield UsersHandler.getUserDevices(userId);
                devices = devices.concat(userDevices);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }

    sendNotifications(devices, title, message, image, type);

    return Boom.OK();
}

function sendNotifications(devices, title, message, image, type) {
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