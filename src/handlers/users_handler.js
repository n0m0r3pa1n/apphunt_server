var Mongoose = require('mongoose')
var User = require('../models').User
var Device = require('../models').Device

function* create(user, deviceNotificationId) {
    if(deviceNotificationId) {
        var device = yield Device.create({ deviceNotificationId: deviceNotificationId, notificationsEnabled: true});
        user.devices.push(device)
    }

    return yield User.findOneOrCreate({email: user.email}, user);
}

function* getAll() {
    return yield User.find({}).exec();
}

function* get(email) {
    return yield User.findOne({email: email});
}

module.exports.create = create
module.exports.getAll = getAll

