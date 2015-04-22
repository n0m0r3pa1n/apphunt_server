var _ = require('underscore')

var User = require('../models').User
var Device = require('../models').Device
var STATUS_CODES = require('../config/config').STATUS_CODES

function* get(email, loginType) {
    var where = {}
    if(loginType !== undefined){
        where.loginType = loginType
    }

    if(email !== undefined) {
        where.email = email;
    }

    return yield User.find(where).exec();
}

function* create(user, notificationId) {
    var user = yield User.findOneOrCreate({email: user.email}, user);
    user = yield User.findOne(user).populate('devices').exec()

	if(notificationId) {
		if (user.devices == undefined || user.devices == null) {
			user.devices = []
		}

		if(isUserDeviceExisting(user.devices, notificationId) == false) {
            var device = yield Device.findOneOrCreate({notificationId: notificationId}, {notificationId: notificationId, notificationsEnabled: true});
			user.devices.push(device)
		}
        user.save()
	}

	return user;
}

function* update(userId, notificationId) {
    var user = yield User.findById(userId).populate('devices').exec();
    if(user == null) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }

    if(isUserDeviceExisting(user.devices, notificationId) == false) {
        var device = yield Device.findOneOrCreate({notificationId: notificationId}, {notificationId: notificationId, notificationsEnabled: true})
        user.devices.push(device)
    } else {
        return { statusCode: STATUS_CODES.CONFLICT }
    }
    user.loginType = user.loginType.toLowerCase()
    user.save(function(err) {
        if(err) {
            console.log(err)
        }
    })
    return {statusCode: STATUS_CODES.OK}
}

function isUserDeviceExisting(devices, notificationId) {
    var isDeviceIdExisting = false;
    for(var i=0; i < devices.length; i++) {
        var currentDevice = devices[i]
        if(currentDevice.notificationId == notificationId) {
            isDeviceIdExisting = true;
            break;
        }
    }

    return isDeviceIdExisting;
}

module.exports.create = create
module.exports.get = get
module.exports.update = update
