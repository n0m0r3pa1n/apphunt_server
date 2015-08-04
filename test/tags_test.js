var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect

var STATUS_CODES = require('../build/config/config').STATUS_CODES
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')

describe("Tags", function () {

    it("should get apps with tags", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createAppWithTags(userResponse.result.id, "com.test", ["test", "test2"])
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.categories.length.should.equal(1)
        response.result.description.should.exist();
        response.result.averageScore.should.eq(4.22)

        var opts = {
            method: "GET",
            url: '/v1/apps/tags?names[]=test'
        }

        var response = yield Server.injectThen(opts)
        response.result.length.should.equal(1)
    });
})