var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var AppsCollection = require("../src/models").AppsCollection
var STATUS_CODES = require('../src/config/config').STATUS_CODES

describe("Collections", function() {

    it("should create empty collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id

        var opts = {
            method: 'POST',
            url: '/collections/apps',
            payload: {
                userId: userId,
                name: "Top hunters",
                description: "The best app hunters",
                picture: "http://pic-bg.net",
                apps: []
            }

        }
        var response = yield Server.injectThen(opts)
        response.statusCode.should.equal(STATUS_CODES.OK)
    });

})
