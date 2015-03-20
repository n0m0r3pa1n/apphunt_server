var User = require('../models').User
var Device = require('../models').Device

function* create(user, notificationId) {
	if(notificationId) {
		var device = yield Device.findOneOrCreate({notificationId: notificationId}, {notificationId: notificationId, notificationsEnabled: true});
		user.devices.push(device)
	}
	return yield User.findOneOrCreate({email: user.email}, user);
}

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

module.exports.create = create
module.exports.get = get

