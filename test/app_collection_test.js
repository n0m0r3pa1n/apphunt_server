var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var AppsCollection = require("../src/models").AppsCollection
var STATUS_CODES = require('../src/config/config').STATUS_CODES
var COLLECTION_STATUSES = require('../src/config/config').COLLECTION_STATUSES
var sleep = require("co-sleep")

describe("App Collections", function() {

    it("should create apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var response = yield dbHelper.createAppsCollection(userId)
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(0)
    });

    it("should add app in an empty collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId]
            }
        }

        var response = yield Server.injectThen(opts)
        response.result.apps.length.should.equal(1)
    });

    it("should add app in not empty collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId]
            }
        }
        yield Server.injectThen(opts)

        var app2Id = (yield dbHelper.createAppWithPackage(userId, "com.omv.bg")).result.id

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [app2Id]
            }
        }

        var response = yield Server.injectThen(opts)
        response.result.apps.length.should.equal(2)
    });

    it("should not add app already in collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId]
            }
        }
        yield Server.injectThen(opts)


        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId]
            }
        }

        var response = yield Server.injectThen(opts)
        response.result.apps.length.should.equal(1)
    });

    it("should get apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId]
            }
        }
        yield Server.injectThen(opts)


        var opts = {
            method: 'GET',
            url: '/app-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        response.result._id.toString().should.equal(collectionId.toString())
    });

    it("should get apps collection with sorted by votesCount apps", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithParams("mailmail")).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "packpack")).result.id

        yield dbHelper.voteApp(app2Id, user2Id)

        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId, app2Id]
            }
        }
        yield Server.injectThen(opts)


        var opts = {
            method: 'GET',
            url: '/app-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        var apps = response.result.apps
        apps[0]._id.toString().should.equal(app2Id.toString())
        apps[1]._id.toString().should.equal(appId.toString())
    });

    it("should get all apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        yield dbHelper.createAppsCollection(userId)
        yield dbHelper.createAppsCollection(userId)

        var opts = {
            method: 'GET',
            url: '/app-collections'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(2)
        response.result.totalCount.should.equal(2)
    });


    it("should get paged apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        yield dbHelper.createAppsCollection(userId)
        yield dbHelper.createAppsCollection(userId)

        var opts = {
            method: 'GET',
            url: '/app-collections?page=1&pageSize=1'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
        response.result.totalCount.should.equal(2)
    });

    it("should search for collections", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithParams("mailmail")).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "packpack")).result.id

        yield dbHelper.voteApp(app2Id, user2Id)

        var collectionResponse = yield dbHelper.createAppsCollection(userId)
        var collectionId = collectionResponse.result.id
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId, app2Id]
            }
        }
        yield Server.injectThen(opts)


        var name = collectionResponse.result.name

        var opts = {
            method: 'GET',
            url: '/app-collections/search?q=Top'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
        var apps = response.result.collections[0].apps
        apps[0]._id.toString().should.equal(app2Id.toString())
        apps[1]._id.toString().should.equal(appId.toString())

    });

    it("should remove app from apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "tctctc")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId, app2Id]
            }
        }
        yield Server.injectThen(opts)

        opts = {
            method: 'DELETE',
            url: '/app-collections/apps?collectionId=' + collectionId + "&appId=" + app2Id
        }

        var response = yield Server.injectThen(opts)

        opts = {
            method: 'GET',
            url: '/app-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        var apps = response.result.apps
        apps.length.should.equal(1)
        apps[0]._id.toString().should.equal(appId)
    });

    it("should remove app collection", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "tctctc")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId, app2Id]
            }
        }
        yield Server.injectThen(opts)


        var opts = {
            method: 'DELETE',
            url: '/app-collections?collectionId=' + collectionId
        }
        var response = yield Server.injectThen(opts)
        var opts = {
            method: 'GET',
            url: '/app-collections?page=1&pageSize=1'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(0)
    })

    it("should favourite app collection", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        var favouriteResponse = yield dbHelper.favouriteCollection(collectionId, userId)
        favouriteResponse.result.statusCode.should.equal(STATUS_CODES.OK)

        opts = {
            method: 'GET',
            url: '/app-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        response.result.favouritedBy.length.should.eq(1)
    })

    it("should make app collection public", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createAppWithPackage(userId, "com.omnomnom")).result.id
        var appId2 = (yield dbHelper.createAppWithPackage(userId, "com.tyga")).result.id
        var appId3 = (yield dbHelper.createAppWithPackage(userId, "com.shtastie")).result.id
        var appId4 = (yield dbHelper.createAppWithPackage(userId, "com.sadpanda")).result.id

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId, appId2, appId3, appId4]
            }
        }
        yield Server.injectThen(opts)


        var opts = {
            method: 'GET',
            url: '/app-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        response.result.status.should.eq(COLLECTION_STATUSES.PUBLIC)
    })

    it("should make app collection private", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createAppWithPackage(userId, "com.omnomnom")).result.id
        var appId2 = (yield dbHelper.createAppWithPackage(userId, "com.tyga")).result.id
        var appId3 = (yield dbHelper.createAppWithPackage(userId, "com.shtastie")).result.id
        var appId4 = (yield dbHelper.createAppWithPackage(userId, "com.sadpanda")).result.id

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId,
            payload: {
                apps: [appId, appId2, appId3, appId4]
            }
        }
        yield Server.injectThen(opts)

        var opts = {
            method: 'DELETE',
            url: '/app-collections/apps?collectionId=' + collectionId + '&appId=' + appId,
        }

        var response = yield Server.injectThen(opts)
        response.result.statusCode.should.eq(STATUS_CODES.OK)
    })

    it("should get apps collection with status", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        var opts = {
            method: 'GET',
            url: '/app-collections?status=draft'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
    });

    it("should get apps collection sorted", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithParams("asdasdasdasdasd")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        yield dbHelper.voteAppsCollection(collectionId, user2Id)
        var collection2Id = (yield dbHelper.createAppsCollection(userId)).result.id

        var opts = {
            method: 'GET',
            url: '/app-collections?sortBy=date'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections[0]._id.toString().should.eq(collection2Id)

        opts = {
            method: 'GET',
            url: '/app-collections?sortBy=vote'
        }

        response = yield Server.injectThen(opts)
        response.result.collections[0]._id.toString().should.eq(collectionId)
    });

    it("should get favourite apps collection for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var collection2Id = (yield dbHelper.createAppsCollection(userId)).result.id

        yield dbHelper.favouriteCollection(collectionId, userId)
        yield dbHelper.favouriteCollection(collection2Id, userId)


        var opts = {
            method: 'GET',
            url: "/app-collections/favourites?userId=" + userId,
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.eq(2)
    });
})
