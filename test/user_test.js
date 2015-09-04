var should = require('chai').should()
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../build/config/config').STATUS_CODES
var loginTypes = require('../build/config/config').LOGIN_TYPES

describe("Users", function() {

	it("should create user", function*() {
		var response = yield dbHelper.createUser()
		response.statusCode.should.equal(STATUS_CODES.OK)
	});

	it("should create user with locale", function*() {
		var response = yield dbHelper.createUser("USA-en")
		response.statusCode.should.equal(STATUS_CODES.OK)
		response.result.locale.should.equals("USA-en")
	});

	it("should update user profile", function*() {
        var email = "dummy"
		var userId = (yield dbHelper.createUserWithEmail(email)).result.id
        var profilePicture = "New profile pic"
        var coverPicture = "New cover pic"
        yield dbHelper.createUserWithPictures(email, profilePicture, coverPicture)
        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/users/' + userId + "?fromDate=" + todayStr + "&toDate=" + todayStr
        }

        var result = (yield Server.injectThen(opts)).result
        result.profilePicture.should.eq(profilePicture)
        result.coverPicture.should.eq(coverPicture)
        result._id.toString().should.eq(String(userId))
	});

	it("should get user by id", function* () {
		var response = yield dbHelper.createUser("USA-en")
		response.statusCode.should.equal(STATUS_CODES.OK)

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

		var opts = {
			method: 'GET',
			url: '/users/' + response.result._id + "?fromDate=" + todayStr + "&toDate=" + todayStr
		}

		var resp = yield Server.injectThen(opts)
		String(resp.result._id).should.eq(String(response.result._id))
	})

	it("should not create user", function*() {
		var response = yield dbHelper.createUser()
		response.statusCode.should.equal(STATUS_CODES.OK)

		var response2 = yield dbHelper.createUser()
		var usersResponse = yield dbHelper.getUsers()
		var users = usersResponse.result
		users.length.should.equal(1)
	})

    it("should get populated user profile", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        var appsIds = yield dbHelper.createFourAppsWithIds(userId)
        yield dbHelper.makeCollectionPublic(userId, collectionId, appsIds)

        var appId = (yield dbHelper.createApp(userId)).result.id
		yield dbHelper.favouriteApp(appId, userId)
		yield dbHelper.favouriteCollection(collectionId, userId)

        var commentResponse = yield dbHelper.createComment(appId, userId)

        var today = new Date();
        var todayStr = today.toString("yyyy-MMM-dd")

        var opts = {
            method: 'GET',
            url: '/users/' + userId + "?fromDate=" + todayStr + "&toDate=" + todayStr
        }

        var result = (yield Server.injectThen(opts)).result
        result.apps.should.eq(5)
        result.collections.should.eq(1)
        result.comments.should.eq(1)
        result.votes.should.eq(6)
		result.favouriteApps.should.eq(1)
		result.favouriteCollections.should.eq(1)
    })

	it("should get all users", function*() {
		var response = yield dbHelper.createUserWithEmail("poli@abv.bg")
		var response2 = yield dbHelper.createUserWithEmail("lqwqwqoli@abv.bg")
		var usersResponse = yield dbHelper.getUsers()
		var users = usersResponse.result
		users.length.should.equal(2)
	})

	it("should get 1 user", function*() {
		var response = yield dbHelper.createUserWithEmail("poli@abv.bg")
		var response2 = yield dbHelper.createUserWithEmail("loli@abv.bg")

		var opts = {
			method: 'GET',
			url: '/users?email=poli@abv.bg'
		}

		var usersResponse =  yield Server.injectThen(opts);
		var users = usersResponse.result
		users.length.should.equal(1)
		users[0].email.should.equal("poli@abv.bg")
	})

	it("should get user by login type", function*() {
		var response = yield dbHelper.createUserWithLoginType("poli@abv.bg", loginTypes.Fake)
		var response2 = yield dbHelper.createUserWithEmail("loli@abv.bg", loginTypes.Custom)

		var opts = {
			method: 'GET',
			url: '/users?loginType=fake'
		}

		var usersResponse =  yield Server.injectThen(opts);
		var users = usersResponse.result
		users.length.should.equal(1)
		users[0].email.should.equal("poli@abv.bg")
	})

	it("should create user with device", function*() {
		var opts = {
			method: 'POST',
			url: '/v1/users',
			payload: {
				name: "dummy",
				email: "bla@sa.sds",
				profilePicture: "http://pic-bg.net",
				loginType: "twitter",
				notificationId: "12345667"
			}
		}
		var response = yield Server.injectThen(opts)
		response.statusCode.should.equal(STATUS_CODES.OK)
		response.result.devices.length.should.equal(1)
	});

	it("should update user device id", function*() {
		var userResponse = yield dbHelper.createUserWithEmail("loli@abv.bg", loginTypes.Twitter)

		var opts = {
			method: 'PUT',
			url: '/v1/users/' + userResponse.result.id,
			payload: {
				notificationId: "Test1111"
			}
		}

		var response = yield Server.injectThen(opts)
		response.statusCode.should.equal(STATUS_CODES.OK)
	});

	it("should get users with score", function*() {
		var user1Id = (yield dbHelper.createUserWithLoginType("loli@abv.bg", loginTypes.Twitter)).result.id
		var user2Id = (yield dbHelper.createUserWithLoginType("lolisdss@abv.bg", loginTypes.Fake)).result.id
		var appId = (yield dbHelper.createApp(user1Id)).result.id
		var app2Id = (yield dbHelper.createAppWithPackage(user2Id, "dsdzfsd.ds")).result.id
		var app2Id = (yield dbHelper.createAppWithPackage(user2Id, "dsdzfsd.kor")).result.id
		//yield dbHelper.createComment(appId, user2Id)
		//yield dbHelper.createComment(appId, user1Id)

		yield dbHelper.voteApp(app2Id, user1Id)

		yield dbHelper.createAppsCollection(user2Id)

		var fromDate = "2015-05-01"

		var today = new Date()

		var opts = {
			method: 'GET',
			url: '/v1/users/scores?fromDate=' + fromDate + "&toDate=" + today
		}

		var response = yield Server.injectThen(opts)
		response.result.length.should.equal(2)
		response.result[0]._id.toString().should.equal(String(user2Id))
		expect(response.result[0].apps).to.exist()
		response.result[0].apps.should.eq(2)
	});

	it("should get favourite apps collection for user", function*() {
		var userId = (yield dbHelper.createUser()).result.id
		var user2Id = (yield dbHelper.createUserWithEmail("asasa")).result.id

		var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
		var collection2Id = (yield dbHelper.createAppsCollection(userId)).result.id

		yield dbHelper.favouriteCollection(collectionId, user2Id)
		yield dbHelper.favouriteCollection(collection2Id, user2Id)


		var opts = {
			method: 'GET',
			url: "/users/" + user2Id + "/favourite-collections?page=1&pageSize=2&userId=" + userId,
		}

		var response = yield Server.injectThen(opts)
		response.result.collections.length.should.eq(2)
		response.result.collections[0].hasVoted.should.exist()
	});
})
