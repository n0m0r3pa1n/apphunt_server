var Mongoose = require("mongoose")
var should = require('chai').should()
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var AppCategory = require("../src/models").AppCategory

describe("Apps", function() {

    it("should create app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)

        response.statusCode.should.equal(200)
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
        response2.statusCode.should.equal(409)
    });

    it("should not create app with not existing user", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(Mongoose.Types.ObjectId())

        response.statusCode.should.equal(400)
    });

    it("should get all apps", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        var opts = {
            method: 'GET',
            url: '/apps'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(200)
        response.result.length.should.equal(1)
    });

    it("should vote app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)
        var opts = {
            method: 'POST',
            url: '/apps/' + response.result.id + "/votes",
            payload: {
                userId: userResponse.result.id
            }
        }

        var response1 =  yield Server.injectThen(opts);
        response1.statusCode.should.equal(200)
    });

    it("should not vote app", function*() {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createApp(userResponse.result.id)
        var opts = {
            method: 'POST',
            url: '/apps/' + appResponse.result.id + "/votes",
            payload: {
                userId: userResponse.result.id
            }
        }
        var vote1Response =  yield Server.injectThen(opts);

        var opts2 = {
            method: 'POST',
            url: '/apps/' + appResponse.result.id + "/votes",
            payload: {
                userId: userResponse.result.id
            }
        }
        var vote2Response =  yield Server.injectThen(opts2);
        vote2Response.statusCode.should.equal(400)
    });

    it("should remove app vote", function*() {
        var userResponse = yield dbHelper.createUser()
        var appCreatedResponse = yield dbHelper.createApp(userResponse.result.id)

        var opts = {
            method: 'POST',
            url: '/apps/' + appCreatedResponse.result.id + "/votes",
            payload: {
                userId: userResponse.result.id
            }
        }

        var userVotedResponse =  yield Server.injectThen(opts);
        userVotedResponse.statusCode.should.equal(200)

        opts = {
            method: 'DELETE',
            url: '/apps/' + appCreatedResponse.result.id + "/votes",
            payload: {
                userId: userResponse.result.id
            }
        }

        var voteDeletedResponse = yield Server.injectThen(opts)
        voteDeletedResponse.statusCode.should.equal(200)

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps/' + todayStr
        }

        var allAppsResponse =  yield Server.injectThen(opts);
        allAppsResponse.result.apps[0].votesCount.should.equal(0)
    });

    it("should get apps by date", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps/' + todayStr + '?page=1&pageSize=2'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(200)
        response.result.apps.length.should.equal(2)
        expect(response.result.totalCount).to.exist()
        expect(response.result.totalPages).to.exist()
        response.result.page.should.equal(1)

    });

    it("should get apps by date with votes info", function*() {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")

        var opts = {
            method: 'POST',
            url: '/apps/' + appResponse.result.id + "/votes",
            payload: {
                userId: userResponse.result.id
            }
        }
        var vote1Response =  yield Server.injectThen(opts);

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts1 = {
            method: 'GET',
            url: '/apps/' + todayStr + '?page=1&pageSize=1&userId=' + userResponse.result.id
        }

        var response =  yield Server.injectThen(opts1);
        expect(response.result.apps[0].hasVoted).to.exist()
        response.result.apps[0].hasVoted.should.equal(true)
        expect(response.result.apps[0].votesCount).to.exist()
        response.result.apps[0].votesCount.should.equal(1)
    });


    it("should get all apps by date", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")



        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps/' + todayStr
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(200)
        response.result.apps.length.should.equal(2)
        expect(response.result.totalCount).to.exist()
        expect(response.result.totalPages).to.not.exist()
        response.result.page.should.equal(0)

    });

    it("should not get apps by date because of invalid param", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps/' + todayStr + '?page=0'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(400)

    });

})
