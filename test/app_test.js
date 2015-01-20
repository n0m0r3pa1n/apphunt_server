var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')

describe("Apps", function() {

    it("should create app", function*() {
        yield dbHelper.createUser()
        var response = yield dbHelper.createApp()
        response.statusCode.should.equal(200)
    });

    it("should not create app", function*() {
        yield dbHelper.createUser()
        var response = yield dbHelper.createApp()

        var response2 = yield dbHelper.createApp()
        response2.statusCode.should.equal(409)
    });

    it("should not create app with not existing user", function*() {
        yield dbHelper.createUser()
        var response = yield dbHelper.createAppWithMail("test@test.com")

        response.statusCode.should.equal(400)
    });
})
