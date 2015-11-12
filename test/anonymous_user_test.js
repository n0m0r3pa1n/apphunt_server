var should = require('chai').should()
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
var _ = require('underscore')
require('./spec_helper')
var STATUS_CODES = require('../build/config/config').STATUS_CODES
var LOGIN_TYPES_FILTER = require('../build/config/config').LOGIN_TYPES_FILTER

describe("Anonymous Users", function () {

    it("should not create anonymous user without advertising id", function*() {
        var opts = {
            method: 'POST',
            url: '/users',
            payload: {
                name: "dummy",
                email: "bla@sa.sds",
                profilePicture: "http://pic-bg.net",
                loginType: "anonymous",
                notificationId: "12345667"
            }
        }

        var result = (yield Server.injectThen(opts)).result
        expect(result.statusCode).to.eq(STATUS_CODES.BAD_REQUEST)
    });

    it("should create anonymous user", function*() {
        var opts = {
            method: 'POST',
            url: '/users',
            payload: {
                name: "dummy",
                email: "bla@sa.sds",
                profilePicture: "http://pic-bg.net",
                loginType: "anonymous",
                notificationId: "12345667",
                advertisingId: "123"
            }
        }

        var result = (yield Server.injectThen(opts)).result
        expect(result._id).to.exist

        var opts2 = {
            method: 'GET',
            url: '/users/anonymous'
        }

        var result2 = (yield Server.injectThen(opts2)).result
        result2[0].user.should.eql(result._id)
    });

    it("should not create anonymous user with existing email", function*() {
        yield dbHelper.createUser()

        var opts = {
            method: 'POST',
            url: '/users',
            payload: {
                name: "dummy",
                email: "dummy@dummy.com",
                profilePicture: "http://pic-bg.net",
                loginType: "anonymous",
                notificationId: "12345667",
                advertisingId: "123"
            }
        }

        var result = (yield Server.injectThen(opts)).result
        result.email.should.not.equal("dummy@dummy.com")
    });

    it("should not create anonymous user with existing email", function*() {
        yield dbHelper.createUser()

        var opts = {
            method: 'POST',
            url: '/users',
            payload: {
                name: "dummy",
                email: "dummy@dummy.com",
                profilePicture: "http://pic-bg.net",
                loginType: "anonymous",
                notificationId: "12345667",
                advertisingId: "123"
            }
        }

        var result = (yield Server.injectThen(opts)).result
        result.email.should.not.equal("dummy@dummy.com")
    });

    it("should create anonymous user with empty email", function*() {
        var opts = {
            method: 'POST',
            url: '/users',
            payload: {
                name: "dummy",
                profilePicture: "http://pic-bg.net",
                loginType: "anonymous",
                notificationId: "12345667",
                advertisingId: "123"
            }
        }

        var result = (yield Server.injectThen(opts)).result
        expect(result.email).to.exist
        result.email.should.not.equal("")
    });

    it("should use same anonymous user with same advertising id", function*() {
        var opts = {
            method: 'POST',
            url: '/users',
            payload: {
                name: "dummy",
                profilePicture: "http://pic-bg.net",
                loginType: "anonymous",
                notificationId: "12345667",
                advertisingId: "123"
            }
        }

        var result = (yield Server.injectThen(opts)).result
        expect(result.email).to.exist

        var result2 = (yield Server.injectThen(opts)).result
        result2.email.should.equal(result.email)

        var opts2 = {
            method: 'GET',
            url: '/users/anonymous'
        }

        var result3 = (yield Server.injectThen(opts2)).result
        result3.length.should.equal(1)
    });

});