var should = require('chai').should()

require('./spec_helper')

function createUser() {
    var advertisingId = "12321321"

    var opts = {
        method: 'POST',
        url: '/users',
        payload: {
            advertisingId: advertisingId
        }
    }

    return Server.injectThen(opts)
}

function getUsers() {
    var opts = {
        method: 'GET',
        url: '/users'
    }

    return Server.injectThen(opts)
}

describe("Users", function() {

    it("should create user", function*() {
        var response = yield createUser()
        response.statusCode.should.equal(200)
    });

    it("should not create user", function*() {
        var response = yield createUser()
        response.statusCode.should.equal(200)

        var response2 = yield createUser()
        var usersResponse = yield getUsers()
        var users = usersResponse.result
        users.length.should.equal(1)
    })
})
