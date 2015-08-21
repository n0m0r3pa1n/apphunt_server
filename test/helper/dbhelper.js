var BadBoy = require('badboy')
var Co = require('co')
var AppsHandler = require('../../build/handlers/apps_handler')
var loginTypes = require("../../build/config/config").LOGIN_TYPES
var APP_STATUSES = require("../../build/config/config").APP_STATUSES

var dummyEmail = "dummy@dummy.com"
var category1 = "TEST1"
var category2 = "TEST2"
var appPackage = "com.dasfqwersdcxxdfgh"
var platform = "Android"

function createApp(userId) {
    return createAppWithParams(userId, appPackage, platform, [])
}

function createAppWithPlatform(userId, platform) {
    return createAppWithParams(userId, appPackage, platform, [])
}

function createAppWithPackage(userId, appPackage) {
    return createAppWithParams(userId, appPackage, platform, [])
}

function createAppWithTags(userId, appPackage, tags) {
    return createAppWithParams(userId, appPackage, platform, tags)
}

function* approveApp(packageName) {

    var opts = {
        method: 'POST',
        url: '/v1/apps/'+packageName+'/status',
        payload: {
            status: APP_STATUSES.APPROVED
        }
    }

    return yield Server.injectThen(opts)
}

function createAppWithParams(userId, appPackage, platform, tags) {
    var name = "Example App";
    var icon = "http://example.com/icon.png";
    var url = "http://example.com";
    if(tags == undefined) {
        tags = []
    }

    var opts = {
        method: 'POST',
        url: '/v1/apps',
        payload: {
            package: appPackage,
            userId: userId,
            description: "Test description",
            platform: platform,
            tags: tags
        }
    }

    return Server.injectThen(opts)
}

function createUser() {
    return createUserWithEmail(dummyEmail)
}

function createUser(locale) {
    return createUserWithParams(null, null, null, null, locale)
}

function createUserWithEmail(email) {
    return createUserWithParams(email, null, null, null, null)
}

function createUserWithPictures(email, profilePicture, coverPicture) {
    return createUserWithParams(email, null, profilePicture, coverPicture, null)
}

function createUserWithParams(email, loginType, profilePicture, coverPicture, locale) {
    var name = "dummy"
    if(email == null) {
        email = dummyEmail
    }
    if(loginType == null) {
        loginType = loginTypes.Twitter
    }
    if(profilePicture == null) {
        profilePicture = "profilePicture"
    }
    if(coverPicture == null) {
        coverPicture = "coverPicture"
    }
    if(locale == null) {
        locale = "en"
    }
    var opts = {
        method: 'POST',
        url: '/v1/users',
        payload: {
            name: name,
            email: email,
            username: "dummy",
            profilePicture: profilePicture,
            coverPicture: coverPicture,
            loginType: loginType,
            locale: locale
        }
    }

    return Server.injectThen(opts)
}

function createUserWithLoginType(email, loginType) {
   return createUserWithParams(email, loginType, null, null, null)
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


function createComment(appId, userId, parentId) {
    var text = "comment text"

    var opts = {
        method: 'POST',
        url: '/v1/comments',
        payload: {
            text: text,
            userId: userId,
            appId: appId
        }
    }
    if(parentId !== undefined) {
        opts.payload.parentId = parentId
    }
    return Server.injectThen(opts)
}

function createCommentWithText(appId, userId, parentId, commentText) {
    var opts = {
        method: 'POST',
        url: '/v1/comments',
        payload: {
            text: commentText,
            userId: userId,
            appId: appId
        }
    }
    if(parentId !== undefined) {
        opts.payload.parentId = parentId
    }
    return Server.injectThen(opts)
}

function voteComment(commentId, userId) {
    var opts = {
        method: 'POST',
        url: '/v1/comments/votes?userId=' + userId + "&commentId=" + commentId
    }

    return Server.injectThen(opts);
}

function voteApp(appId, userId) {
    var opts = {
        method: 'POST',
        url: '/apps/votes?appId=' + appId + "&userId=" + userId
    }

    return Server.injectThen(opts);
}

function voteAppsCollection(collectionId, userId) {
    var opts = {
        method: 'POST',
        url: '/app-collections/votes?collectionId=' + collectionId + "&userId=" + userId
    }

    return Server.injectThen(opts);
}

function createAppsCollectionWithParams(userId, name) {
    var opts = {
        method: 'POST',
        url: '/app-collections',
        payload: {
            userId: userId,
            name: name,
            description: "The best apps for march",
            picture: "http://pic-bg.net"
        }
    }

    return Server.injectThen(opts)
}

function createAppsCollection(userId) {
    var opts = {
        method: 'POST',
        url: '/app-collections',
        payload: {
            userId: userId,
            name: "Top apps for march",
            description: "The best apps for march",
            picture: "http://pic-bg.net"
        }
    }

    return Server.injectThen(opts)
}

function createUsersCollection(userId) {
    var opts = {
        method: 'POST',
        url: '/user-collections',
        payload: {
            userId: userId,
            name: "Top hunters",
            description: "The best app hunters",
            picture: "http://pic-bg.net"
        }
    }

    return Server.injectThen(opts)
}

function favouriteCollection(collectionId, userId) {
    var opts = {
        method: 'PUT',
        url: '/app-collections/' + collectionId + "/actions/favourite?userId=" + userId
    }

    return Server.injectThen(opts)
}

function getCollection(collectionId) {
    var opts = {
        method: 'GET',
        url: '/app-collections/' + collectionId
    }

    return Server.injectThen(opts)
}

function createBanner(url) {
    var opts = {
        method: 'POST',
        url: '/app-collections/banners',
        payload: {
            url: url
        }
    }

    return Server.injectThen(opts)
}

var updateCollection = {
    name: "Top apps for march june july",
    description: "Desc",
    picture: "Pic",
    apps: []
}

function* makeCollectionPublic(userId, collectionId, appsIds) {
    updateCollection.apps = appsIds

    var opts3 = {
        method: 'PUT',
        url: '/app-collections/' + collectionId + "?userId=" + userId,
        payload: {
            collection: updateCollection
        }
    }

    return (yield Server.injectThen(opts3)).result
}

function* createAppsIdsList(userId) {
    var appId = (yield createApp(userId)).result.id
    var app2Id = (yield createAppWithPackage(userId, "com.test1")).result.id
    var app3Id = (yield createAppWithPackage(userId, "com.test2")).result.id
    var app4Id = (yield createAppWithPackage(userId, "com.test3")).result.id

    return [appId, app2Id, app3Id, app4Id];
}

module.exports.createApp = createApp
module.exports.createAppWithPackage = createAppWithPackage
module.exports.createAppWithPlatform = createAppWithPlatform
module.exports.createAppWithTags = createAppWithTags
module.exports.createAppWithParams = createAppWithParams
module.exports.createBanner = createBanner
module.exports.createUser = createUser
module.exports.createUserWithEmail = createUserWithEmail
module.exports.createUserWithLoginType = createUserWithLoginType
module.exports.createUserWithPictures = createUserWithPictures
module.exports.createNotification = createNotification
module.exports.getUsers = getUsers
module.exports.createComment = createComment
module.exports.createCommentWithText = createCommentWithText
module.exports.voteComment = voteComment
module.exports.voteApp = voteApp
module.exports.voteAppsCollection = voteAppsCollection
module.exports.createAppsCollection = createAppsCollection
module.exports.createAppsCollectionWithParams = createAppsCollectionWithParams
module.exports.createUsersCollection = createUsersCollection
module.exports.favouriteCollection = favouriteCollection
module.exports.getCollection = getCollection
module.exports.makeCollectionPublic = makeCollectionPublic
module.exports.approveApp = approveApp
module.exports.createAppsIdsList = createAppsIdsList
module.exports.EMAIL = dummyEmail
module.exports.CATEGORY_1 = category1
module.exports.CATEGORY_2 = category2
