var Mongoose = require("mongoose")
var should = require('chai').should()
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var AppCategory = require("../src/models").AppCategory
var STATUS_CODES = require('../src/config').STATUS_CODES

describe("Votes", function() {
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
        response1.statusCode.should.equal(STATUS_CODES.OK)
        expect(response1.result.votesCount).to.exist()
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
        vote2Response.statusCode.should.equal(STATUS_CODES.NOT_FOUND)
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
        userVotedResponse.statusCode.should.equal(STATUS_CODES.OK)

        opts = {
            method: 'DELETE',
            url: '/apps/' + appCreatedResponse.result.id + "/votes",
            payload: {
                userId: userResponse.result.id
            }
        }

        var voteDeletedResponse = yield Server.injectThen(opts)
        voteDeletedResponse.statusCode.should.equal(STATUS_CODES.OK)

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/apps?platform=Android&date=' + todayStr
        }

        var allAppsResponse =  yield Server.injectThen(opts);
        allAppsResponse.result.apps[0].votesCount.should.equal(0)
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
            url: '/apps?date='+todayStr+'&platform=Android&page=1&pageSize=1&userId=' + userResponse.result.id
        }

        var response =  yield Server.injectThen(opts1);
        expect(response.result.apps[0].hasVoted).to.exist()
        response.result.apps[0].hasVoted.should.equal(true)
        expect(response.result.apps[0].votesCount).to.exist()
        response.result.apps[0].votesCount.should.equal(1)
        expect(response.result.apps[0].votes).to.not.exist()
    });
})
