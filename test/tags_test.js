var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect

var STATUS_CODES = require('../build/config/config').STATUS_CODES
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')

describe("Tags", function () {

    it("should get apps with tags", function*() {
        var userResponse = yield dbHelper.createUser()
        var firstAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["test", "test2"])
        firstAppResponse.statusCode.should.equal(STATUS_CODES.OK)
        firstAppResponse.result.categories.length.should.equal(1)
        firstAppResponse.result.description.should.exist();
        firstAppResponse.result.averageScore.should.eq(4.22)

        var opts = {
            method: "GET",
            url: '/v1/apps/tags?names[]=test'
        }

        var response = yield Server.injectThen(opts)
        response.result.length.should.equal(1)

        var opts2 = {
            method: "GET",
            url: '/v1/apps/tags?names[]=racing&names[]=adventure'
        }

        var getAppsResponse = yield Server.injectThen(opts2)
        getAppsResponse.result.length.should.equal(1)
    });

    it("should get sorted apps by tags occurence", function*() {
        var userResponse = yield dbHelper.createUser()
        var firstAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["nomnom", "test2"])
        var secondAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test2", ["nomnom", "test15"])
        var thirdAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test3", ["nomnom", "test15"])

        var opts = {
            method: "GET",
            url: '/v1/apps/tags?names[]=nomnom&names[]=test15'
        }

        var result = (yield Server.injectThen(opts)).result
        result.length.should.equal(3)
        result[0].package.should.equal("com.test2")
        result[1].package.should.equal("com.test3")
        result[2].package.should.equal("com.test")

        var opts2 = {
            method: "GET",
            url: '/v1/apps/tags?names[]=nomnom&names[]=test2'
        }

        var result2 = (yield Server.injectThen(opts2)).result
        result2.length.should.equal(3)
        result2[0].package.should.equal("com.test")
        result2[1].package.should.equal("com.test2")
        result2[2].package.should.equal("com.test3")
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

    it("should get collections with tags", function*() {
        var userResponse = yield dbHelper.createUser()
        var firstAppResponse = yield dbHelper.createAppsCollection(userResponse.result.id)
        firstAppResponse.statusCode.should.equal(STATUS_CODES.OK)

        var opts = {
            method: "GET",
            url: '/v1/collections/tags?names[]=march'
        }

        var response = yield Server.injectThen(opts)
        response.result.length.should.equal(0)

        var opts1 = {
            method: 'GET',
            url: '/app-collections',
        }
        var response1 = yield Server.injectThen(opts1)
        response1.result.collections[0].tags.length.should.eq(4)
    });

    it("should get collections and apps with tags", function*() {
        var userResponse = yield dbHelper.createUser()
        var collectionResponse = yield dbHelper.createAppsCollection(userResponse.result.id)
        collectionResponse.statusCode.should.equal(STATUS_CODES.OK)

        var firstAppResponse = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["march", "test2"])

        var opts = {
            method: "GET",
            url: '/v1/tags?names[]=march'
        }

        var result = (yield Server.injectThen(opts)).result
        result.apps.length.should.eq(1)
        result.collections.length.should.eq(0)

        var opts2 = {
            method: "GET",
            url: '/v1/tags?names[]=top'
        }

        var result2 = (yield Server.injectThen(opts2)).result
        result2.apps.length.should.eq(0)
        result2.collections.length.should.eq(0)
    });
})