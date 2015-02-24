var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../src/config').STATUS_CODES
var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

describe("Apps", function () {

    it("should create Android app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)

        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.categories.length.should.equal(1)
        response.result.description.should.exist();
    });


    it("should create iOS app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createAppWithParams(userResponse.result.id, "908842747", "iOS")

        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.categories.length.should.equal(1)
        response.result.description.should.exist();
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

    it("should update app", function*() {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createApp(userResponse.result.id)
        var app = appResponse.result
        app.status = "approved"
        app.createdAt = new Date(2015, 3, 14)

        var opts = {
            method: 'PUT',
            url: '/apps',
            payload: {
                app: app
            }
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.status.should.equal("approved")
        response.result.createdAt.getDate().should.equal(14)
    });


    it("should delete app", function*() {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createApp(userResponse.result.id)

        var opts = {
            method: 'DELETE',
            url: '/apps?package=' + appResponse.result.package
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)

        opts = {
            method: 'GET',
            url: '/apps?platform=Android&status=all'
        }

        var getAppsResponse = yield Server.injectThen(opts);
        getAppsResponse.statusCode.should.equal(STATUS_CODES.OK)
        getAppsResponse.result.apps.length.should.equal(0)
    });

    it("should get all apps", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        var opts = {
            method: 'GET',
            url: '/apps?platform=Android&status=all'
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(1)
    });

    it("should get apps by date", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poliiii")

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?date=' + todayStr + '&page=1&pageSize=2&platform=Android&status=all'
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(2)
        expect(response.result.totalCount).to.exist()
        response.result.totalCount.should.equal(2)
        expect(response.result.totalPages).to.exist()
        response.result.page.should.equal(1)

    });

    it("should get all apps by date", function*() {
        var userResponse = yield dbHelper.createUser()
        var appR1 = yield dbHelper.createApp(userResponse.result.id)
        var appR2 = yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poliiii")


        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?platform=Android&status=all&date=' + todayStr
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(2)
        expect(response.result.totalCount).to.exist()
        expect(response.result.totalPages).to.not.exist()
        response.result.page.should.equal(0)
    });

    it("should  not get all apps with future date", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poliiii")

        var today = new Date();
        var dateString = new Date(today.getTime() + DAY_MILLISECONDS * 6).toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?platform=Android&status=all&date=' + dateString
        }

        var response = yield Server.injectThen(opts);
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
            url: '/apps?date=' + todayStr + '&status=all&page=0&platform=Android'
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.BAD_REQUEST)

    });

    it("should get apps by platform", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.poli", "Android")
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.koli", "iOS")

        var opts = {
            method: 'GET',
            url: '/apps?platform=Android&status=all'
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(1)
        response.result.totalCount.should.equal(1)
    });

    it("should not get apps with invalid platform", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.poliiiii", "Android")
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.koliiii", "iOS")

        var opts = {
            method: 'GET',
            url: '/apps?platform=invalidPlatform&status=all'
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.BAD_REQUEST)
    });

    it("should return non-existing packages", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.test1", "Android")
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.test2", "Android")
        yield dbHelper.createAppWithParams(userResponse.result.id, "com.test3", "Android")

        var existingAppList = ['com.test1', 'com.test2', 'com.test4']

        var opts = {
            method: 'POST',
            url: '/apps/actions/filter',
            payload: {
                packages: existingAppList,
                platform: "Android"
            }
        }

        var response = yield Server.injectThen(opts);
        response.result.availablePackages.length.should.equal(1)
        response.result.existingPackages.length.should.equal(2)
    });

    it("should get apps order by votes count", function*() {
        var userResponse = yield dbHelper.createUser()
        var user2Response = yield dbHelper.createUserWithParams("abv@abv.vf")
        var app1Response = yield dbHelper.createAppWithParams(userResponse.result.id, "com.test1", "Android")
        var app2Response = yield dbHelper.createAppWithParams(userResponse.result.id, "com.test2", "Android")

        var opts = {
            method: 'POST',
            url: '/apps/votes?appId=' + app1Response.result.id + "&userId=" + userResponse.result.id
        }

        var opts2 = {
            method: 'POST',
            url: '/apps/votes?appId=' + app2Response.result.id + "&userId=" + userResponse.result.id
        }

        var opts3 = {
            method: 'POST',
            url: '/apps/votes?appId=' + app2Response.result.id + "&userId=" + user2Response.result.id
        }

        var vote1Response = yield Server.injectThen(opts);
        var vote2Response = yield Server.injectThen(opts2);
        var vote3Response = yield Server.injectThen(opts3);


        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?date=' + todayStr + '&status=all&page=1&platform=Android&pageSize=12'
        }

        var response = yield Server.injectThen(opts);
        var apps = response.result.apps
        assert(apps[0].votesCount > apps[1].votesCount)
    });
})


