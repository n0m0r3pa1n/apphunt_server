var Mongoose = require("mongoose")
var should = require('chai').should()
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var AppCategory = require("../src/models").AppCategory
var STATUS_CODES = require('../src/config').STATUS_CODES
var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

describe("Apps", function() {

    it("should create app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)

        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.categories.length.should.equal(2)
        response.result.description.should.exist();
    });

    it("should create 2 categories", function*() {
        var userResponse = yield dbHelper.createUser()
        var r = yield dbHelper.createApp(userResponse.result.id)
        var r2 = yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli.com")
        var categories = yield AppCategory.find({}).exec()
        categories.length.should.equal(2)

    });

    it("should not create app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)

        var response2 = yield dbHelper.createApp(userResponse.result.id)
        response2.statusCode.should.equal(STATUS_CODES.CONFLICT)
    });

    it("should not create app with not existing user", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(Mongoose.Types.ObjectId())

        response.statusCode.should.equal(STATUS_CODES.BAD_REQUEST)
    });

    it("should get all apps", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        var opts = {
            method: 'GET',
            url: '/apps'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(1)
    });

    it("should get apps by date", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?date='+todayStr+'&page=1&pageSize=2'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(2)
        expect(response.result.totalCount).to.exist()
        response.result.totalCount.should.equal(2)
        expect(response.result.totalPages).to.exist()
        response.result.page.should.equal(1)

    });

    it("should get all apps by date", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?date='+todayStr
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(2)
        expect(response.result.totalCount).to.exist()
        expect(response.result.totalPages).to.not.exist()
        response.result.page.should.equal(0)
    });

    it("should  not get all apps with future date", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")

        var today = new Date();
        var dateString = new Date(today.getTime() + DAY_MILLISECONDS*6).toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?date='+dateString
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(0)
    });

    it("should not get apps with invalid page", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?date='+todayStr+'&page=0'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.BAD_REQUEST)

    });

    it("should get apps by platform", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.poli", "Android")
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.koli", "iOS")

        var opts = {
            method: 'GET',
            url: '/apps?platform=Android'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(1)
        response.result.totalCount.should.equal(1)
    });

    it("should not get apps with invalid platform", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.poli", "Android")
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.koli", "iOS")

        var opts = {
            method: 'GET',
            url: '/apps?platform=invalidPlatform'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.BAD_REQUEST)
    });


})
