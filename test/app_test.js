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

    it("should create and vote for Android app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)
        var opts = {
            method: "GET",
            url: '/v1/apps/' + response .result.id + "?userId=" + userResponse.result.id
        }

        var appResponse = yield Server.injectThen(opts)
        appResponse.result.votes.length.should.equal(1)
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

    it("should delete app", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appResponse = yield dbHelper.createApp(userId)
        var appId = appResponse.result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id
        var childCommentId = (yield dbHelper.createComment(appId, userId, commentId)).result.id

        yield dbHelper.voteComment(commentId, userId)

        var user2Id = (yield dbHelper.createUserWithParams("asdsdsadas")).result.id
        yield  dbHelper.voteComment(commentId, user2Id)
        yield dbHelper.voteComment(childCommentId, user2Id)

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

    it("should return empty apps array", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poliiii")

        var opts = {
            method: 'GET',
            url: '/apps?date=2015-02-01&page=1&pageSize=10&platform=Android'
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(0)

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

	it("should get app with comments count", function*() {
		var user1Id = (yield dbHelper.createUser()).result.id
		var user2Id = (yield dbHelper.createUserWithParams("test@test.co")).result.id

		var appId = (yield dbHelper.createApp(user1Id)).result.id

		var comment1Id = (yield dbHelper.createComment(appId, user1Id)).result.id
		var comment2Id = (yield dbHelper.createComment(appId, user2Id, comment1Id)).result.id

		var userResponse = yield dbHelper.createUser()
		yield dbHelper.createApp(userResponse.result.id)
		var opts = {
			method: 'GET',
			url: '/apps?platform=Android&status=all'
		}

		var response = yield Server.injectThen(opts);
		response.statusCode.should.equal(STATUS_CODES.OK)
		response.result.apps[0].commentsCount.should.equal(2)
	});

    it("should search app by name", function*() {
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


        var opts = {
            method: 'GET',
            url: '/apps/search?q=Test&page=1&platform=Android&pageSize=2&userId=' + userResponse.result.id
        }

        var response = yield Server.injectThen(opts);
        var apps = response.result.apps
        apps.length.should.equal(2)
    });
})


