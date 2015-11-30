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