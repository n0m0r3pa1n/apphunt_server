var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var AppsCollection = require("../src/models").AppsCollection
var STATUS_CODES = require('../src/config/config').STATUS_CODES

describe("Collections", function() {

    it("should create users collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var response = yield dbHelper.createUsersCollection(userId)
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.usersDetails.length.should.equal(0)
    });

    it("should add user in an empty collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        yield dbHelper.createAppWithPackage(userId, "sasasa")
        yield dbHelper.createComment(appId, userId)

        var fromDate = new Date();
        var toDate = new Date();

        var opts = {
            method: 'PUT',
            url: '/user-collections/' + collectionId,
            payload: {
                users: [userId],
                fromDate: fromDate,
                toDate: toDate
            }
        }

        var response = yield Server.injectThen(opts)
        response.result.usersDetails.length.should.equal(1)
        expect(response.result.usersDetails[0].score).to.be.above(0)
    });

    //it("should add user in not empty collection", function*() {
    //    var userId = (yield dbHelper.createUser()).result.id
    //    var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id
    //
    //    var opts = {
    //        method: 'PUT',
    //        url: '/user-collections/' + collectionId,
    //        payload: {
    //            users: [userId]
    //        }
    //    }
    //
    //    yield Server.injectThen(opts)
    //
    //    var user2Id = (yield dbHelper.createUserWithParams("sadasdasd@as.ads")).result.id
    //
    //    var opts = {
    //        method: 'PUT',
    //        url: '/user-collections/' + collectionId,
    //        payload: {
    //            users: [user2Id]
    //        }
    //    }
    //
    //    var response = yield Server.injectThen(opts)
    //    response.result.users.length.should.equal(2)
    //});
    //
    //it("should not add user already in collection", function*() {
    //    var userId = (yield dbHelper.createUser()).result.id
    //    var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id
    //
    //    var opts = {
    //        method: 'PUT',
    //        url: '/user-collections/' + collectionId,
    //        payload: {
    //            users: [userId]
    //        }
    //    }
    //
    //    yield Server.injectThen(opts)
    //
    //    var opts = {
    //        method: 'PUT',
    //        url: '/user-collections/' + collectionId,
    //        payload: {
    //            users: [userId]
    //        }
    //    }
    //
    //    var response = yield Server.injectThen(opts)
    //    response.result.users.length.should.equal(1)
    //});
    //
    it("should get users collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id

        var opts = {
            method: 'GET',
            url: '/user-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        response.result.id.should.equal(collectionId)
    });


})
