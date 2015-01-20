var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')

describe("Users", function() {

    it("should create user", function*() {
        var response = yield dbHelper.createUser()
        response.statusCode.should.equal(200)
    });

    it("should not create user", function*() {
        var response = yield dbHelper.createUser()
        response.statusCode.should.equal(200)

        var response2 = yield dbHelper.createUser()
        var usersResponse = yield dbHelper.getUsers()
        var users = usersResponse.result
        users.length.should.equal(1)
        users[0].notificationsEnabled.should.equal(true)
    })
})
