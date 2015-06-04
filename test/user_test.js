var should = require('chai').should()
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../src/config/config').STATUS_CODES
var loginTypes = require('../src/config/config').LOGIN_TYPES

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

	it("should not create user", function*() {
		var response = yield dbHelper.createUser()
		response.statusCode.should.equal(STATUS_CODES.OK)

		var response2 = yield dbHelper.createUser()
		var usersResponse = yield dbHelper.getUsers()
		var users = usersResponse.result
		users.length.should.equal(1)
	})

	it("should get all users", function*() {
		var response = yield dbHelper.createUserWithParams("poli@abv.bg")
		var response2 = yield dbHelper.createUserWithParams("lqwqwqoli@abv.bg")
		var usersResponse = yield dbHelper.getUsers()
		var users = usersResponse.result
		users.length.should.equal(2)
	})

	it("should get 1 user", function*() {
		var response = yield dbHelper.createUserWithParams("poli@abv.bg")
		var response2 = yield dbHelper.createUserWithParams("loli@abv.bg")

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
		var response2 = yield dbHelper.createUserWithParams("loli@abv.bg", loginTypes.Custom)

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
		var userResponse = yield dbHelper.createUserWithParams("loli@abv.bg", loginTypes.Twitter)

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
		yield dbHelper.createComment(appId, user2Id)
		yield dbHelper.createComment(appId, user1Id)

		yield dbHelper.voteApp(app2Id, user1Id)

		var fromDate = "2015-05-01"

		var today = new Date()

		var opts = {
			method: 'GET',
			url: '/v1/users/scores?fromDate=' + fromDate + "&toDate=" + today
		}

		var response = yield Server.injectThen(opts)
		response.result.length.should.equal(2)
		response.result[0]._id.toString().should.equal(user1Id)
	});
})
