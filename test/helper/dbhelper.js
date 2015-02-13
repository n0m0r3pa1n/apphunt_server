var loginTypes = require("../../src/config").loginTypes

var email = "dummy@dummy.com"
var category1 = "TEST1"
var category2 = "TEST2"
var appPackage = "com.dasfqwersdcxxdfgh"
var platform = "Android"

function createApp(userId) {
    return createAppWithParams(userId, appPackage, platform)
}

function createAppWithPlatform(userId, platform) {
    return createAppWithParams(userId, appPackage, platform)
}

function createAppWithPackage(userId, appPackage) {
    return createAppWithParams(userId, appPackage, platform)
}

function createAppWithParams(userId, appPackage, platform) {
    var name = "Example App";
    var icon = "http://example.com/icon.png";
    var url = "http://example.com";

    var opts = {
        method: 'POST',
        url: '/v1/apps',
        payload: {
            package: appPackage,
            userId: userId,
            description: "Test description",
            platform: platform
        }
    }

    return Server.injectThen(opts)
}

function createUser() {
    return createUserWithParams(email)
}

function createUser(locale) {
    var name = "dummy"

    var opts = {
        method: 'POST',
        url: '/v1/users',
        payload: {
            name: name,
            email: email,
            profilePicture: "http://pic-bg.net",
            locale: locale,
            loginType: loginTypes.Facebook
        }
    }

    return Server.injectThen(opts)
}

function createUserWithParams(email) {
    var name = "dummy"

    var opts = {
        method: 'POST',
        url: '/v1/users',
        payload: {
            name: name,
            email: email,
            profilePicture: "http://pic-bg.net",
            loginType: loginTypes.Facebook
        }
    }

    return Server.injectThen(opts)
}

function createNotification() {
    var opts = {
        method: 'POST',
        url: '/notifications',
        payload: {
            title: "Title",
            message: "Message",
            type: "DailyReminder"
        }
    }

    return Server.injectThen(opts)
}

function getUsers() {
    var opts = {
        method: 'GET',
        url: '/v1/users'
    }

    return Server.injectThen(opts)
}

module.exports.createApp = createApp
module.exports.createAppWithPackage = createAppWithPackage
module.exports.createAppWithPlatform = createAppWithPlatform
module.exports.createAppWithParams = createAppWithParams
module.exports.createUser = createUser
module.exports.createUserWithParams = createUserWithParams
module.exports.createNotification = createNotification
module.exports.getUsers = getUsers
module.exports.EMAIL = email
module.exports.CATEGORY_1 = category1
module.exports.CATEGORY_2 = category2
