var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var AppsCollection = require("../src/models").AppsCollection
var STATUS_CODES = require('../src/config/config').STATUS_CODES

describe("Collections", function() {

    it("should create empty collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var response = yield dbHelper.createAppsCollection(userId)
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(0)
    });

    it("should create collection with app", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var response = yield dbHelper.createAppsCollectionWithApps(userId, [appId])
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(1)
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
        var appId = (yield dbHelper.createApp(userId)).result.id
        var collectionId = (yield dbHelper.createAppsCollectionWithApps(userId, [appId])).result.id

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
        var appId = (yield dbHelper.createApp(userId)).result.id
        var collectionId = (yield dbHelper.createAppsCollectionWithApps(userId, [appId])).result.id

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

    it("should get collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var collectionId = (yield dbHelper.createAppsCollectionWithApps(userId, [appId])).result.id

        var opts = {
            method: 'GET',
            url: '/app-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        response.result.id.should.equal(collectionId)
        response.result.apps.length.should.equal(1)
    });

    it("should search for collections", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var collection = yield dbHelper.createAppsCollectionWithApps(userId, [appId])

        var name = collection.name

        var opts = {
            method: 'GET',
            url: '/app-collections/search?q=Top'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
    });

})
