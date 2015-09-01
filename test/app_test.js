var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../build/config/config').STATUS_CODES
var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

describe("Apps", function () {

    it("should create Android app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.categories.length.should.equal(1)
        response.result.description.should.exist();
        response.result.averageScore.should.eq(4.22)
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
        var opts = {
            method: 'POST',
            url: '/v1/apps',
            payload: {
                package: "com.test",
                userId: userResponse.result.id,
                description: "Test description",
                platform: "Android"
            }
        }

        var response = yield Server.injectThen(opts)

        var opts2 = {
            method: 'POST',
            url: '/v1/apps',
            payload: {
                package: "com.test",
                userId: userResponse.result.id,
                description: "Test description",
                platform: "Android"
            }
        }

        var response2 = yield Server.injectThen(opts)
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

        var user2Id = (yield dbHelper.createUserWithEmail("asdsdsadas")).result.id
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
        response.result.apps[0].categories.length.should.exist()
    });

    it("should get apps per user", function*() {
        var userResponse = yield dbHelper.createUser()
        var userResult = userResponse.result
        var appPackage = (yield dbHelper.createApp(userResult.id)).result.package
        yield dbHelper.createAppWithPackage(userResult.id, "com.test3")
        yield dbHelper.createAppWithPackage(userResult.id, "com.test2")
        yield dbHelper.approveApp(appPackage)
        yield dbHelper.approveApp("com.test3")
        yield dbHelper.approveApp("com.test2")

        var opts = {
            method: 'GET',
            url: '/users/'+userResult.id+'/apps'
        }

        var response = yield Server.injectThen(opts);
        var result = response.result;
        result.apps.length.should.eq(3)
        result.totalCount.should.eq(3)

        var opts2 = {
            method: 'GET',
            url: '/users/'+userResult.id+'/apps?page=1&pageSize=2'
        }

        var paginatedResult = (yield Server.injectThen(opts2)).result;
        paginatedResult.apps.length.should.eq(2)
        paginatedResult.totalCount.should.eq(3)
        paginatedResult.page.should.eq(1)
        paginatedResult.totalPages.should.eq(2)
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

    it("should get apps by date range", function*() {
        var userResponse = yield dbHelper.createUser()
        var appId = (yield dbHelper.createApp(userResponse.result.id)).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("AASa@asd.ds")).result.id
        yield dbHelper.voteApp(appId, user2Id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poliiii")

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var toDate = new Date();
        var toDateStr = toDate.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?date=' + todayStr + '&' + 'toDate=' + toDateStr + '&platform=Android&status=all'
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(2)
        expect(response.result.totalCount).to.exist()
        response.result.totalCount.should.equal(2)
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
        var user2Response = yield dbHelper.createUserWithEmail("abv@abv.vf")
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
		var user2Id = (yield dbHelper.createUserWithEmail("test@test.co")).result.id

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
        var user2Response = yield dbHelper.createUserWithEmail("abv@abv.vf")
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
            url: '/apps/search?q=test&page=1&platform=Android&pageSize=2'
        }

        var response = yield Server.injectThen(opts);
        var apps = response.result.apps
        apps.length.should.equal(0)
    });

    it("should get apps by name and date range", function*() {
        var userResponse = yield dbHelper.createUser()
        var user2Response = yield dbHelper.createUserWithEmail("abv@abv.vf")
        var app1Response = yield dbHelper.createAppWithParams(userResponse.result.id, "com.test1", "Android")
        var app2Response = yield dbHelper.createAppWithParams(userResponse.result.id, "com.test2", "Android")

        var fromDateStr = new Date().toString("yyyy-MMM-dd")
        var toDateStr = new Date().toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?query=test&status=all&page=1&platform=Android&pageSize=2&date=' + fromDateStr + "&toDate=" + toDateStr
        }

        var response = yield Server.injectThen(opts);
        var apps = response.result.apps
        apps.length.should.equal(2)
    });

    it("should change Android app status", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)

        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.categories.length.should.equal(1)
        response.result.description.should.exist();

        var opts = {
            method: 'POST',
            url: '/apps/com.dasfqwersdcxxdfgh/status',
            payload: {
                status: "approved"
            }
        }

        var response2 = yield Server.injectThen(opts);
        response2.result.statusCode.should.equal(200)

        var opts2 = {
            method: 'GET',
            url: '/apps?platform=Android&status=approved'
        }

        var response3 = yield Server.injectThen(opts2);
        response3.statusCode.should.equal(STATUS_CODES.OK)
        response3.result.apps.length.should.equal(1)
        response3.result.apps[0].status.should.equal('approved')

        opts.payload.status = 'rejected'
        var response2 = yield Server.injectThen(opts);
        response2.result.statusCode.should.equal(200)

        var response4 = yield Server.injectThen(opts2);
        response4.result.apps.length.should.equal(0)
    });

    it("should get all paginated apps", function*() {
        var userResponse = yield dbHelper.createUser()
        for(var i=0; i < 7; i ++) {
            yield dbHelper.createAppWithPackage(userResponse.result.id, "com.sad.panda." + i)
        }

        var opts = {
            method: 'GET',
            url: '/apps?platform=Android&status=all&page=1&pageSize=5'
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(5)
        response.result.totalPages.should.equal(2)
    });

    it("should favourite app for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        yield dbHelper.favouriteApp(appId, userId)

        var opts = {
            method: 'GET',
            url: '/apps/' + appId
        }

        var response = yield Server.injectThen(opts);
        response.result.favouritedBy.length.should.eq(1)

        var opts2 = {
            method: 'GET',
            url: '/apps/' + appId + "?userId=" + userId
        }
        var response2 = yield Server.injectThen(opts2);
        response2.result.isFavourite.should.eq(true)
    });

    it("should unfavourite app for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asas")).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        yield dbHelper.favouriteApp(appId, userId)
        yield dbHelper.favouriteApp(appId, user2Id)

        var opts = {
            method: 'DELETE',
            url: '/apps/' + appId + '/actions/favourite?userId=' + userId
        }
        yield Server.injectThen(opts)

        opts = {
            method: 'GET',
            url: '/apps/' + appId
        }

        var response = yield Server.injectThen(opts);
        response.result.favouritedBy.length.should.eq(1)
        response.result.favouritedBy[0].toString().should.eq(String(user2Id))
    });

    it("should get favourite apps for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("muuuu")).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "asas")).result.id
        yield dbHelper.favouriteApp(appId, userId)
        yield dbHelper.favouriteApp(app2Id, userId)
        yield dbHelper.favouriteApp(app2Id, user2Id)

        opts = {
            method: 'GET',
            url: '/users/'+userId+'/favourite-apps?userId=' + user2Id + "&page=1&pageSize=2"
        }

        var response = yield Server.injectThen(opts);
        response.result.apps.length.should.eq(2)
        expect(response.result.apps[0].hasVoted).to.exist()
        for(var i=0; i < response.result.apps.length; i++) {
            var app = response.result.apps[i]
            if(app.id == app2Id) {
                app.hasVoted.should.eq(true)
            }
        }
    });
})


