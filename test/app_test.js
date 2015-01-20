var should = require('chai').should()

require('./spec_helper')

function createUser() {
    var name = "dummy"
    var email = "dummy@dummy.com"

    var opts = {
        method: 'POST',
        url: '/users',
        payload: {
            name: name,
            email: email
        }
    }

    return Server.injectThen(opts)
}

describe("Users", function() {

    //it("should create app", function*() {
    //    var response = yield createUser()
    //    response.statusCode.should.equal(200)
    //});
})
