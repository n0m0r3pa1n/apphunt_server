var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../src/config').STATUS_CODES

describe("Notifications", function() {

    it("should create notification", function*() {
        var response = yield dbHelper.createNotification()
        response.statusCode.should.equal(STATUS_CODES.OK)
    });


    it("should get notification", function*() {
        var response = yield dbHelper.createNotification()

        var opts = {
            method: 'GET',
            url: '/notifications?type=' + response.result.type
        }

        var response2 = yield Server.injectThen(opts)

        response2.statusCode.should.equal(STATUS_CODES.OK)
        response2.result.title.should.equal(response.result.title)
    });

    it("should send notification when app is approved", function*() {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createApp(userResponse.result.id)
        var opts = {
            method: 'POST',
            url: '/apps/com.dasfqwersdcxxdfgh/status',
            payload: {
                status: "approved"
            }
        }

        var approvedResponse = yield Server.injectThen(opts);
        approvedResponse.result.statusCode.should.equal(200)
    });
})
