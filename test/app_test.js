var Mongoose = require("mongoose")
var should = require('chai').should()
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./helper/cleardb')
require('./helper/dbhelper')
require('./helper/inject-server')
var STATUS_CODES = require('../src/config').STATUS_CODES
var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
var simple = require('simple-mock');


describe("Real Apps", function() {
    before(function() {
        simple.restore()
    })

    it("should not create Android app with invalid package", function*() {
        var userResponse = yield dbHelper.createUser()
        var response = yield dbHelper.createAppWithPackage(userResponse.result.id, 'com.dsadaskjldjaskldajskldsa')

        response.statusCode.should.equal(STATUS_CODES.NOT_FOUND)
    });

    //it("should create app with valid bit.ly link", function*() {
    //    var userResponse = yield dbHelper.createUser()
    //    var response = yield dbHelper.createAppWithPackage(userResponse.result.id, 'com.aa.generaladaptiveapps')
    //
    //    response.statusCode.should.equal(STATUS_CODES.OK)
    //});

    after(function() {
        require('./helper/mock-badboy')
        require('./helper/mock-bitly')
    })
})
