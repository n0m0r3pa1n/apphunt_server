var should = require('chai').should()
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../build/config/config').STATUS_CODES

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

    it("should create child comment", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id
        var childCommentResponse = yield dbHelper.createComment(appId, userId, commentId)

		childCommentResponse.result.parent.id.should.equal(commentId)


        yield dbHelper.voteComment(childCommentResponse.result.id, userId)

        var opts = {
            method: 'GET',
            url: '/v1/comments/' + appId + "?page=1&pageSize=2&userId=" + userId
        }

        var response = yield Server.injectThen(opts)
        response.result.comments[0].children.length.should.equal(1)
        expect(response.result.comments[0].children[0].hasVoted).to.exist()
        response.result.comments[0].children[0].hasVoted.should.equal(true)
    });

    it("should get sorted comments", function*() {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("test@test.co")).result.id

        var appId = (yield dbHelper.createApp(user1Id)).result.id

        var comment1Id = (yield dbHelper.createComment(appId, user1Id)).result.id
        var comment2Id = (yield dbHelper.createComment(appId, user2Id)).result.id

        yield dbHelper.voteComment(comment1Id, user1Id)
        yield dbHelper.voteComment(comment1Id, user2Id)

        var opts = {
            method: 'GET',
            url: '/v1/comments/' + appId + "?page=1&pageSize=2&userId=" + user1Id
        }

        var response = yield Server.injectThen(opts)
        response.result.comments[0].votesCount.should.equal(2)
        response.result.comments[1].votesCount.should.equal(0)
        expect(response.result.comments[0].createdBy.email).to.exist()
    });

    it("should vote for comments", function*(){
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id

        var voteResponse = yield dbHelper.voteComment(commentId, userId)
        voteResponse.result.votesCount.should.equal(1)
    })

    it("should delete vote for comments", function*(){
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id

        yield dbHelper.voteComment(commentId, userId)

        var opts = {
            method: 'DELETE',
            url: '/v1/comments/votes?userId=' + userId + "&commentId=" + commentId
        }

        var unvoteResponse = yield Server.injectThen(opts)
        unvoteResponse.statusCode.should.equal(STATUS_CODES.OK)
        unvoteResponse.result.votesCount.should.equal(0)
    })

    it("should delete comment", function*(){
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id

        yield dbHelper.voteComment(commentId, userId)

        var opts = {
            method: 'DELETE',
            url: '/v1/comments?commentId=' + commentId
        }

        var deleteResponse = yield Server.injectThen(opts)
        deleteResponse.statusCode.should.equal(STATUS_CODES.OK)

        opts = {
            method: 'GET',
            url: '/v1/comments/' + appId + "?page=1&pageSize=2&userId=" + userId
        }

        var response = yield Server.injectThen(opts)
        response.result.comments.length.should.equal(0)

    })

    it("should delete child comment", function*(){
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id
        var childCommentId = (yield dbHelper.createComment(appId, userId, commentId)).result.id
        var childComment2Id = (yield dbHelper.createComment(appId, userId, commentId)).result.id

        var opts = {
            method: 'DELETE',
            url: '/v1/comments?commentId=' + childCommentId
        }

        var deleteChildResponse = yield Server.injectThen(opts)
        deleteChildResponse.statusCode.should.equal(STATUS_CODES.OK)

        opts = {
            method: 'DELETE',
            url: '/v1/comments?commentId=' + commentId
        }

        var deleteResponse = yield Server.injectThen(opts)
        deleteResponse.statusCode.should.equal(STATUS_CODES.OK)

        opts = {
            method: 'GET',
            url: '/v1/comments/' + appId + "?page=1&pageSize=2&userId=" + userId
        }

        var response = yield Server.injectThen(opts)
        response.result.comments.length.should.equal(0)

    })

    it("should reply to a user comment with notification", function*() {
        var userResult = (yield dbHelper.createUser()).result
        var userId = userResult.id
        var userName = userResult.username
        var appId = (yield dbHelper.createApp(userId)).result.id
        var commentId = (yield dbHelper.createComment(appId, userId)).result.id
        var childCommentResponse = yield dbHelper.createCommentWithText(appId, userId, commentId, "@" + userName + " om nom nom")

        childCommentResponse.result.parent.id.should.equal(commentId)


        yield dbHelper.voteComment(childCommentResponse.result.id, userId)

        var opts = {
            method: 'GET',
            url: '/v1/comments/' + appId + "?page=1&pageSize=2&userId=" + userId
        }

        var response = yield Server.injectThen(opts)
        response.result.comments[0].children.length.should.equal(1)
        expect(response.result.comments[0].children[0].hasVoted).to.exist()
        response.result.comments[0].children[0].hasVoted.should.equal(true)
    });

    it("should get comments for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asasasa")).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id

        var comment1 = (yield dbHelper.createComment(appId, userId)).result
        yield dbHelper.createComment(appId, user2Id)
        var vote = (yield dbHelper.voteComment(comment1._id, user2Id)).result
        yield dbHelper.createComment(appId, userId)


        var opts = {
            method: 'GET',
            url: '/v1/users/'+userId+'/comments?page=1&pageSize=2&userId=' + user2Id
        }
        var response = yield Server.injectThen(opts)
        response.result.comments.length.should.eq(2)
        response.result.totalCount.should.eq(2)
        response.result.comments[0].hasVoted.should.eq(true)
        response.result.comments[1].hasVoted.should.eq(false)
        expect(response.result.comments[0].app.name).to.exist()
    });

})

