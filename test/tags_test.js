var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect

var STATUS_CODES = require('../build/config/config').STATUS_CODES
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')

describe("Tags", function () {

    var updateCollection = {
        name: "Top apps for march june july",
        description: "Desc",
        picture: "Pic",
        apps: []
    }

    it("should get apps with tags", function*() {
        var userResponse = yield dbHelper.createUser()
        var firstAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["test", "test2"])
        var secondAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test2", ["test", "test2"])
        var thirdAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test3", ["test", "test2"])

        yield dbHelper.approveApp("com.test")
        yield dbHelper.approveApp("com.test2")
        yield dbHelper.approveApp("com.test3")
        
        firstAppResponse.statusCode.should.equal(STATUS_CODES.OK)
        firstAppResponse.result.categories.length.should.equal(1)

        var opts = {
            method: "GET",
            url: '/v1/apps/tags?names[]=test&page=1&pageSize=2'
        }

        var response = yield Server.injectThen(opts)
        response.result.totalCount.should.equal(3)
        response.result.totalPages.should.equal(2)
        response.result.page.should.equal(1)
        response.result.apps.length.should.equal(2)

        var opts2 = {
            method: "GET",
            url: '/v1/apps/tags?names[]=racing&names[]=adventure'
        }

        var getAppsResponse = yield Server.injectThen(opts2)
        getAppsResponse.result.apps.length.should.equal(3)

        var opts3 = {
            method: "GET",
            url: '/v1/apps/tags?names[]=test&page=2&pageSize=2'
        }

        var response3 = yield Server.injectThen(opts3)
        response3.result.totalCount.should.equal(3)
        response3.result.totalPages.should.equal(2)
        response3.result.page.should.equal(2)
        response3.result.apps.length.should.equal(1)
    });

    it("should get sorted apps by tags occurence", function*() {
        var userResponse = yield dbHelper.createUser()
        var firstAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["nomnom", "test2"])
        var secondAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test2", ["nomnom", "test15"])
        var thirdAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test3", ["nomnom", "test15"])

        yield dbHelper.approveApp("com.test")
        yield dbHelper.approveApp("com.test2")
        yield dbHelper.approveApp("com.test3")
        var opts = {
            method: "GET",
            url: '/v1/apps/tags?names[]=nomnom&names[]=test15'
        }

        var result = (yield Server.injectThen(opts)).result
        result.apps.length.should.equal(3)
        result.apps[0].package.should.equal("com.test2")
        result.apps[1].package.should.equal("com.test3")
        result.apps[2].package.should.equal("com.test")

        var opts2 = {
            method: "GET",
            url: '/v1/apps/tags?names[]=nomnom&names[]=test2'
        }

        var result2 = (yield Server.injectThen(opts2)).result
        result2.apps.length.should.equal(3)
        result2.apps[0].package.should.equal("com.test")
        result2.apps[1].package.should.equal("com.test2")
        result2.apps[2].package.should.equal("com.test3")
    });

    it("should get tags suggestions", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["shazam", "music"])
        var response2 = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test2", ["test4", "example1"])
        response.statusCode.should.equal(STATUS_CODES.OK)
        response2.statusCode.should.equal(STATUS_CODES.OK)

        var opts = {
            method: "GET",
            url: '/v1/tags/suggest?name=m'
        }

        var response = yield Server.injectThen(opts)
        const APP_NAME_AND_TAGS_LENGTH = 1
        response.result.tags.length.should.eq(APP_NAME_AND_TAGS_LENGTH);
    });

    it("should get paginated collections with tags", function*() {
        var userResponse = yield dbHelper.createUser()
        var collectionResponse = yield dbHelper.createAppsCollection(userResponse.result.id)
        var collection2Response = yield dbHelper.createAppsCollectionWithParams(userResponse.result.id, "test march")
        var collection3Response = yield dbHelper.createAppsCollectionWithParams(userResponse.result.id, "test 2 march")
        var appsIds = yield dbHelper.createFourAppsWithIds(userResponse.result.id)
        yield dbHelper.makeCollectionPublic(userResponse.result.id, collectionResponse.result.id, appsIds)
        yield dbHelper.makeCollectionPublic(userResponse.result.id, collection2Response.result.id, appsIds)
        yield dbHelper.makeCollectionPublic(userResponse.result.id, collection3Response.result.id, appsIds)

        collectionResponse.statusCode.should.equal(STATUS_CODES.OK)
        collection2Response.statusCode.should.equal(STATUS_CODES.OK)
        collection3Response.statusCode.should.equal(STATUS_CODES.OK)

        var opts = {
            method: "GET",
            url: '/v1/app-collections/tags?names[]=march&userId=' + userResponse.result.id + '&page=1&pageSize=2'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(2)
        response.result.page.should.eq(1)
        response.result.totalPages.should.eq(2)
        response.result.totalCount.should.eq(3)
        response.result.collections.length.should.eq(2)
        response.result.collections[0].
            hasVoted.should.eq(true)


        var opts3 = {
            method: "GET",
            url: '/v1/app-collections/tags?names[]=march&userId=' + userResponse.result.id + '&page=2&pageSize=2'
        }

        var response3 = yield Server.injectThen(opts3)
        response3.result.collections.length.should.equal(1)
        response3.result.totalPages.should.eq(2)
        response3.result.totalCount.should.eq(3)
        response3.result.page.should.eq(2)


        var opts1 = {
            method: 'GET',
            url: '/app-collections',
        }
        var response1 = yield Server.injectThen(opts1)
        response1.result.collections[0].tags.length.should.eq(3)
    });

    it("should get collections and apps with tags", function*() {
        var userResponse = yield dbHelper.createUser()
        var userId = userResponse.result.id
        var collectionResponse = yield dbHelper.createAppsCollection(userResponse.result.id)
        var collectionId = collectionResponse.result.id
        collectionResponse.statusCode.should.equal(STATUS_CODES.OK)
        var appIds = yield dbHelper.createFourAppsWithIds(userId)
        yield dbHelper.makeCollectionPublic(userId, collectionId, appIds)

        var firstAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["march", "test2"])
        yield dbHelper.approveApp("com.test")

        var opts = {
            method: "GET",
            url: '/v1/tags?names[]=march&userId=' + userResponse.result.id
        }

        var result = (yield Server.injectThen(opts)).result
        result.apps.length.should.eq(1)
        result.apps[0].hasVoted.should.eq(true)
        result.collections.length.should.eq(1)

        var opts2 = {
            method: "GET",
            url: '/v1/tags?names[]=top'
        }

        var result2 = (yield Server.injectThen(opts2)).result
        result2.apps.length.should.eq(0)
        result2.collections.length.should.eq(1)
    });

    it("should delete tags for app", function* () {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["nomnom", "test2"])

        var opts = {
            method: 'DELETE',
            url: '/apps?package=' + appResponse.result.package
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)

        var opts2 = {
            method: "GET",
            url: '/v1/tags?names[]=nomnom'
        }

        var result2 = (yield Server.injectThen(opts2)).result
        result2.apps.length.should.eq(0)
    })

})