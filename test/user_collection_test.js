var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var AppsCollection = require("../build/models").AppsCollection
var STATUS_CODES = require('../build/config/config').STATUS_CODES

describe("User Collections", function() {

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

    it("should add user in not empty collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id

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

        yield Server.injectThen(opts)

        var user2Id = (yield dbHelper.createUserWithParams("sadasdasd@as.ads")).result.id

        var opts = {
            method: 'PUT',
            url: '/user-collections/' + collectionId,
            payload: {
                users: [user2Id],
                fromDate: fromDate,
                toDate: toDate
            }
        }

        var response = yield Server.injectThen(opts)
        response.result.usersDetails.length.should.equal(2)
    });

    it("should not add user already in collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id

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

        yield Server.injectThen(opts)

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
    });

    it("should get users collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id

        var opts = {
            method: 'GET',
            url: '/user-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        response.result._id.toString().should.equal(collectionId)
    });

    it("should get all user collections", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        yield dbHelper.createUsersCollection(userId)
        yield dbHelper.createUsersCollection(userId)

        var opts = {
            method: 'GET',
            url: '/user-collections'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(2)
        response.result.totalCount.should.equal(2)
    });

    it("should get all available collections for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id
        var collection2Id = (yield dbHelper.createUsersCollection(userId)).result.id
        var user2Id = (yield dbHelper.createUserWithParams("asas.saa")).result.id

        var opts = {
            method: 'PUT',
            url: '/user-collections/' + collectionId,
            payload: {
                users: [userId],
                fromDate: new Date(),
                toDate: new Date()
            }
        }

        yield Server.injectThen(opts)

        var opts = {
            method: 'PUT',
            url: '/user-collections/' + collection2Id,
            payload: {
                users: [user2Id],
                fromDate: new Date(),
                toDate: new Date()
            }
        }

        yield Server.injectThen(opts)


        var opts = {
            method: 'GET',
            url: '/user-collections/available?userId=' + userId
        }

        var response = yield Server.injectThen(opts)
        response.result.length.should.equal(1)
    });

    it("should search for collections", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithParams("mailmail")).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "packpack")).result.id

        var collectionResponse = yield dbHelper.createUsersCollection(userId)
        var collectionId = collectionResponse.result.id

        var today = new Date()
        var opts = {
            method: 'PUT',
            url: '/user-collections/' + collectionId,
            payload: {
                users: [userId, user2Id],
                fromDate: today,
                toDate: today
            }
        }
        var addUsersResponse = yield Server.injectThen(opts)

        var opts = {
            method: 'GET',
            url: '/user-collections/search?q=Top'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
        var usersDetails = response.result.collections[0].usersDetails
        usersDetails[0].user._id.toString().should.equal(userId.toString())
        usersDetails[1].user._id.toString().should.equal(user2Id.toString())

    });

    it("should remove user from users collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithParams("mailmail")).result.id

        var collectionResponse = yield dbHelper.createUsersCollection(userId)
        var collectionId = collectionResponse.result.id

        var today = new Date()
        var opts = {
            method: 'PUT',
            url: '/user-collections/' + collectionId,
            payload: {
                users: [userId, user2Id],
                fromDate: today,
                toDate: today
            }
        }

        var collectionResponse2 = yield Server.injectThen(opts)
        opts = {
            method: 'DELETE',
            url: '/user-collections/users?collectionId=' + collectionId + "&userDetailsId=" + collectionResponse2.result.usersDetails[0]._id
        }

        var response = yield Server.injectThen(opts)
        opts = {
            method: 'GET',
            url: '/user-collections/' + collectionId
        }

        var response = yield Server.injectThen(opts)
        response.result.usersDetails.length.should.equal(1)
    });

    it("should remove collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id
        yield dbHelper.createUsersCollection(userId)
        var opts = {
            method: 'DELETE',
            url: '/user-collections?collectionId=' + collectionId
        }

        yield Server.injectThen(opts)

        var opts = {
            method: 'GET',
            url: '/user-collections'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
    })
})
