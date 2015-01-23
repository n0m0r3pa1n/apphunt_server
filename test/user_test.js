var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../src/config').STATUS_CODES

describe("Users", function() {

    it("should create user", function*() {
        var response = yield dbHelper.createUser()
        response.statusCode.should.equal(STATUS_CODES.OK)
    });

    it("should not create user", function*() {
        var response = yield dbHelper.createUser()
        response.statusCode.should.equal(STATUS_CODES.OK)

        var response2 = yield dbHelper.createUser()
        var usersResponse = yield dbHelper.getUsers()
        var users = usersResponse.result
        users.length.should.equal(1)
    })
})
