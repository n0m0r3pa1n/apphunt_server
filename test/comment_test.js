var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../src/config').STATUS_CODES

describe("Comments", function() {

    it("should create comment", function*() {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createApp(userResponse.result.id)
        var commentResponse = yield dbHelper.createComment(appResponse.result.id, userResponse.result.id)
        commentResponse.statusCode.should.equal(STATUS_CODES.OK)
    });

    it("should not create comment with non existing app", function*() {
        var userResponse = yield dbHelper.createUser()
        var commentResponse = yield dbHelper.createComment(userResponse.result.id, userResponse.result.id)
        commentResponse.statusCode.should.equal(STATUS_CODES.NOT_FOUND)
    });

    it("should not create comment with non existing parent", function*() {
        var userResponse = yield dbHelper.createUser()
        var appResponse = yield dbHelper.createApp(userResponse.result.id)
        var commentResponse = yield dbHelper.createComment(appResponse.result.id, userResponse.result.id, userResponse.result.id)
        commentResponse.statusCode.should.equal(STATUS_CODES.NOT_FOUND)
    });

    it("should get sorted comments", function*() {
        var user1Id = (yield dbHelper.createUser()).result.id
        //var userResponse = yield dbHelper.createUser()
        var appId = (yield dbHelper.createApp(user1Id)).result.id

        var commentResponse = yield dbHelper.createComment(appId, user1Id)
        commentResponse.statusCode.should.equal(STATUS_CODES.OK)

        var opts = {
            method: 'GET',
            url: '/v1/comments/' + appId + "?page=1&pageSize=1&userId=" + user1Id
        }
        var response = yield Server.injectThen(opts)
    });
})
