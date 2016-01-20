var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect

var STATUS_CODES = require('../build/config/config').STATUS_CODES
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')

describe("Ads", function () {

    it("should create ad", function*() {
        (yield createAd()).statusCode.should.equal(STATUS_CODES.OK)
    });

    it("should get ad", function*() {
        yield createAd()
        var opts = {
            method: "GET",
            url: '/ad'
        }

        var response = yield Server.injectThen(opts)
        response.result.name.should.eq("Ad Name")
    });

    it('should not display ad to user user', function*() {
        yield createAd()
        var user = (yield dbHelper.createUser()).result
        var app = (yield dbHelper.createApp(user.id)).result
        yield dbHelper.approveApp(app.package)

        yield dbHelper.createComment(app.id, user.id)

        var opts = {
            method: 'GET',
            url: '/ads/status?userId=' + user.id + "&adLoadNumber=2"
        }

        var response = yield Server.injectThen(opts)
        response.result.shouldShowAd.should.eq(false)
    })

    it('should display ad to user user', function*() {
        yield createAd()
        var user = (yield dbHelper.createUser()).result
        var user2 = (yield dbHelper.createUserWithEmail('user@test.com')).result
        var app = (yield dbHelper.createApp(user2.id)).result
        yield dbHelper.approveApp(app.package)

        yield dbHelper.createComment(app.id, user.id)

        var opts = {
            method: 'GET',
            url: '/ads/status?userId=' + user.id + "&adLoadNumber=1"
        }

        var response = yield Server.injectThen(opts)
        response.result.shouldShowAd.should.eq(true)
    })

    it('should get non ad free user ad status', function*() {
        yield createAd()
        var user = (yield dbHelper.createUser()).result
        var user2 = (yield dbHelper.createUserWithEmail('user@test.com')).result
        var app = (yield dbHelper.createApp(user2.id)).result
        yield dbHelper.approveApp(app.package)
        yield dbHelper.createComment(app.id, user.id)

        var opts = {
            method: 'GET',
            url: '/users/'+user.id+'/ads/status'
        }

        var response = yield Server.injectThen(opts)
        response.result.shouldShowAd.should.eq(true)
    })

    it('should get ad free user ad status', function*() {
        yield createAd()
        var user = (yield dbHelper.createUser()).result
        var user2 = (yield dbHelper.createUserWithEmail('user@test.com')).result
        var app = (yield dbHelper.createApp(user2.id)).result
        yield dbHelper.approveApp(app.package)
        yield dbHelper.createComment(app.id, user.id)
        yield dbHelper.createCommentWithText(app.id, user.id, undefined, 'test')
        yield dbHelper.createCommentWithText(app.id, user.id, undefined, 'test2')

        var opts = {
            method: 'GET',
            url: '/users/'+user.id+'/ads/status'
        }

        var response = yield Server.injectThen(opts)
        response.result.shouldShowAd.should.eq(false)
    })


    function createAd() {
        var opts = {
            method: "POST",
            url: '/ads',
            payload: {
                name: "Ad Name",
                picture: "dsl;kj",
                link: "http://www.w3schools.com/jsref/jsref_random.asp"
            }
        }

        return Server.injectThen(opts)
    }
})