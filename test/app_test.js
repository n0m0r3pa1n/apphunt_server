var Mongoose = require("mongoose")
var should = require('chai').should()
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
        console.log("id " + response.result.id)
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

    it("should get apps by date", function*() {
        var userResponse = yield dbHelper.createUser()
        yield dbHelper.createApp(userResponse.result.id)
        yield dbHelper.createAppWithPackage(userResponse.result.id, "com.poli")

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")
        console.log(todayStr)

        var opts = {
            method: 'GET',
            url: '/apps/' + todayStr + '?page=1&pageSize=2'
        }

        var response =  yield Server.injectThen(opts);
        response.statusCode.should.equal(200)
        response.result.length.should.equal(2)

    });

})
