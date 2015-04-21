var dbHelper = require('./helper/dbhelper')
require('./helper/cleardb')
require('./helper/dbhelper')
require('./helper/inject-server')
var initMock = require('./spec_helper').initMock
var STATUS_CODES = require('../src/config/config').STATUS_CODES
var simple = require('simple-mock');

describe("Real Apps", function() {
    before(function() {
        initMock()
    })

    xit("should not create Android app with invalid package", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createAppWithPackage(userResponse.result.id, 'com.dsadaskjldjaskldajskldsa')

        response.statusCode.should.equal(STATUS_CODES.NOT_FOUND)
    });

    it("should create app with valid bit.ly link", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createAppWithPackage(userResponse.result.id, 'com.bandainamcogames.outcast')

        response.statusCode.should.equal(STATUS_CODES.OK)
    });

    it("should update app", function*() {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createApp(userResponse.result.id)
        var app = appResponse.result
        app.status = "approved"
        app.createdAt = new Date(2015, 3, 14)

        var opts = {
            method: 'PUT',
            url: '/apps',
            payload: {
                app: app
            }
        }

        var response = yield Server.injectThen(opts);
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.status.should.equal("approved")
        response.result.createdAt.getDate().should.equal(14)
    });

    after(function() {
        simple.restore()
    })
})
