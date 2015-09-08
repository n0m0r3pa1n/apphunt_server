var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
var Bolt = require('bolt-js')
var Config = require('../build/config/config');
var boltAppId = Config.BOLT_APP_ID
require('./spec_helper')
var STATUS_CODES = Config.STATUS_CODES
var _ = require("underscore")

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

    it("should get notification types", function*() {
        var opts = {
            method: 'GET',
            url: '/notifications/types'
        }

        var response = yield Server.injectThen(opts)
        response.result.length.should.eq(_.keys(Config.NOTIFICATION_TYPES).length)
    });

    it("should send notifications to users", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var opts = {
            method: 'POST',
            url: '/notifications/actions/send',
            payload: {
                users: [userId],
                title: "Test",
                message: "Notifications",
                type: Config.NOTIFICATION_TYPES.USER_COMMENT,
                image: ""
            }
        }

        var response = yield Server.injectThen(opts)
        response.result.statusCode.should.eq(STATUS_CODES.OK)
    });

})
