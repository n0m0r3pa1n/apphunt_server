var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../src/config').STATUS_CODES

describe("Users", function() {

    it("should create user", function*() {
        var response = yield dbHelper.createUser()
        response.statusCode.should.equal(STATUS_CODES.OK)
    });

    it("should create user with locale", function*() {
        var response = yield dbHelper.createUser("USA-en")
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.locale.should.equals("USA-en")
    });

    it("should not create user", function*() {
        var response = yield dbHelper.createUser()
        response.statusCode.should.equal(STATUS_CODES.OK)

        var response2 = yield dbHelper.createUser()
        var usersResponse = yield dbHelper.getUsers()
        var users = usersResponse.result
        users.length.should.equal(1)
    })

    it("should get all users", function*() {
        var response = yield dbHelper.createUserWithParams("poli@abv.bg")
        var response2 = yield dbHelper.createUserWithParams("lqwqwqoli@abv.bg")
        var usersResponse = yield dbHelper.getUsers()
        var users = usersResponse.result
        users.length.should.equal(2)
    })

    it("should get 1 user", function*() {
        var response = yield dbHelper.createUserWithParams("poli@abv.bg")
        var response2 = yield dbHelper.createUserWithParams("loli@abv.bg")

        var opts = {
            method: 'GET',
            url: '/users?email=poli@abv.bg'
        }

        var usersResponse =  yield Server.injectThen(opts);
        var users = usersResponse.result
        users.length.should.equal(1)
        users[0].email.should.equal("poli@abv.bg")
    })
})
