var User = require('../models').User
var Device = require('../models').Device

function* create(user, deviceNotificationId) {
    if(deviceNotificationId) {
        var device = yield Device.create({ deviceNotificationId: deviceNotificationId, notificationsEnabled: true});
        user.devices.push(device)
    }
    return yield User.findOneOrCreate({email: user.email}, user);
}

function* get(email) {
    var where = {}
    if(email !== undefined){
        where.email = email
    }
    return yield User.find(where).exec();
}

module.exports.create = create
module.exports.get = get

