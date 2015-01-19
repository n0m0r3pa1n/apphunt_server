var should = require('chai').should()

require('./spec_helper')

function createClient(username, password) {

    var options = {
        method: 'POST',
        url: '/clients',
        payload: {
            username: username,
            password: password
        }
    }

    return Server.injectThen(options)
}

describe("Clients", function() {

    it("should create client", function* () {
        var response = yield createClient("Hello", "World")
        response.statusCode.should.equal(200)
        var result = response.result
        result.username.should.equal("Hello")
    })

    it("should not create client", function* () {
         yield createClient("Hello", "World")
         var response = yield createClient("Hello", "World")
         response.statusCode.should.equal(400)
    })

    it("should get client", function*() {
        var response = yield createClient("Hello", "World")
        var appSpiceId = response.result.appSpiceId
        var opts = {
            method: 'GET',
            url: '/clients/' + appSpiceId
        }
        response = yield Server.injectThen(opts)
        response.statusCode.should.equal(200)
        var result = response.result
        result.username.should.equal("Hello")
        result.appSpiceId.should.equals(appSpiceId)
    })

    it("should login client", function*() {
        var username = "Hello"
        var password = "World"
        var response = yield createClient(username, password)
        var appSpiceId = response.result.appSpiceId

        var opts = {
            method: 'POST',
            url: '/clients/actions/login',
            payload: {
                username: username,
                password: password
            }
        }
        response = yield Server.injectThen(opts)
        response.statusCode.should.equal(200)
        response.result.appSpiceId.should.equals(appSpiceId)
    })

    it("should not login client", function*() {
        var username = "Hello"
        var password = "World"
        var response = yield createClient(username, password)
        var appSpiceId = response.result.appSpiceId

        var opts = {
            method: 'POST',
            url: '/clients/actions/login',
            payload: {
                username: username,
                password: "123"
            }
        }
        response = yield Server.injectThen(opts)
        response.statusCode.should.equal(404)
    })

})
