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
        var user2Id = (yield dbHelper.createUser()).result.id

        var appId = (yield dbHelper.createApp(user1Id)).result.id

        var comment1Id = (yield dbHelper.createComment(appId, user1Id)).result.id
        var comment2Id = (yield dbHelper.createComment(appId, user2Id)).result.id

        yield dbHelper.voteComment(comment1Id, user1Id)
        yield dbHelper.voteComment(comment1Id, user2Id)

        //yield dbHelper.voteComment(user1Id, comment2Id)

        var opts = {
            method: 'GET',
            url: '/v1/comments/' + appId + "?page=1&pageSize=2&userId=" + user1Id
        }

        var response = yield Server.injectThen(opts)
        response.result.comments[0].votesCount.should.equal(2)
        response.result.comments[1].votesCount.should.equal(0)
    });

    it("should vote for comments", function*(){
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id

        var voteResponse = yield dbHelper.voteComment(commentId, userId)
        voteResponse.result.votes.length.should.equal(1)
    })

    it("should delete vote for comments", function*(){
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id

        yield dbHelper.voteComment(commentId, userId)

        var opts = {
            method: 'DELETE',
            url: '/v1/comments/votes?userId=' + userId + "&commentId=" + commentId,
        }

        var unvoteResponse = yield Server.injectThen(opts)
        unvoteResponse.statusCode.should.equal(STATUS_CODES.OK)
        unvoteResponse.result.votesCount.should.equal(0)
    })
})
