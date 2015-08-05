var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect
require('./spec_helper')

var LATEST_APP_VERSION = require('../build/config/config').LATEST_APP_VERSION
var STATUS_CODES = require('../build/config/config').STATUS_CODES
describe("Version", function () {

    it("should get Android app latest version", function*() {
        var opts = {
            method: "GET",
            url: '/v1/app/version'
        }

        var result = (yield Server.injectThen(opts)).result
        result.versionCode.should.eq(LATEST_APP_VERSION.versionCode)
    });

    it("should update Android app latest version", function*() {
        var opts = {
            method: "PUT",
            url: '/v1/app/version',
            payload: {
                versionCode: 21
            }
        }

        var result = (yield Server.injectThen(opts)).result
        result.statusCode.should.eq(STATUS_CODES.OK)

        var opts2 = {
            method: "GET",
            url: '/v1/app/version'
        }

        var result2 = (yield Server.injectThen(opts2)).result
        result2.versionCode.should.eq(21)
    });
});