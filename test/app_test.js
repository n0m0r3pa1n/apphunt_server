var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
var Mongoose = require('mongoose')
require('./spec_helper')

describe("Apps", function() {

    it("should create app", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createApp(userResponse.result.id)

        response.statusCode.should.equal(200)
        response.result.categories.length.should.equal(2)
        response.result.description.should.exist();
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
        var response = yield dbHelper.createApp(userResponse.result.id)
        var opts = {
            method: 'POST',
            url: '/apps/' + response.result.id + "/votes",
            payload: {
                userId: userResponse.result.id
            }
        }

        var response1 =  yield Server.injectThen(opts)

        var opts1 = {
            method: 'POST',
            url: '/users',
            payload: {
                name: "test",
                email: "test@test"
            }
        }

        var userResponse2 = yield Server.injectThen(opts1)

        var opts2 = {
            method: 'POST',
            url: '/apps/' + response.result.id + "/votes",
            payload: {
                userId: userResponse2.result.id
            }
        }
        var response2 =  yield Server.injectThen(opts2);
        //response2.statusCode.should.equal(400)
    });
})
