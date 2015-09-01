var expect = require('chai').expect
var should = require('chai').should()
var assert = require('chai').assert
var dbHelper = require('./helper/dbhelper')
var _ = require('underscore')
require('./spec_helper')
var AppsCollection = require("../build/models").AppsCollection
var STATUS_CODES = require('../build/config/config').STATUS_CODES
var COLLECTION_STATUSES = require('../build/config/config').COLLECTION_STATUSES

var updateCollection = {
    name: "Name",
    description: "Desc",
    picture: "Pic",
    apps: []
}


describe("App Collections", function() {

    it("should create apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var response = yield dbHelper.createAppsCollection(userId)
        response.statusCode.should.equal(STATUS_CODES.OK)
        response.result.apps.length.should.equal(0)
        var response2 = yield dbHelper.createAppsCollectionWithParams(userId, "top apps for june")
        var opts2 = {
            method: 'GET',
            url: "/app-collections",
        }

        var response3 = yield Server.injectThen(opts2)
        var collections = response3.result.collections
        collections[0].tags.should.eql([ 'top', 'apps', 'for', 'june' ])
        collections[1].tags.should.eql([ 'top', 'apps', 'for', 'march' ])
    });

    it("should create apps collection without banner", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        yield dbHelper.createBanner("AAAAA");
        yield dbHelper.createBanner("AAAAABBBB");

        var opts = {
            method: 'POST',
            url: '/app-collections',
            payload: {
                userId: userId,
                name: "Top apps for march",
                description: "The best apps for march"
            }
        }
        var response = yield Server.injectThen(opts)
        response.result.picture.should.exist()
    });

    it("should update apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id

        updateCollection.name = "TestName"
        updateCollection.description = "TestDesc"
        updateCollection.picture = "TestPic"
        updateCollection.apps = [appId]

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }


        var response = yield Server.injectThen(opts)
        response.result.name.should.eq("TestName")
        response.result.description.should.eq("TestDesc")
        response.result.picture.should.eq("TestPic")
        response.result.apps.length.should.eq(1)
    });

    it("should not update apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("ASAS")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        updateCollection.apps = [appId]

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + user2Id,
            payload: {
                collection: updateCollection
            }
        }

        var response = yield Server.injectThen(opts)
        response.result.statusCode.should.eq(STATUS_CODES.METHOD_NOT_ALLOWED)
    });

    it("should add app in an empty collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id

        updateCollection.apps = [appId]

        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }

       yield Server.injectThen(opts)

       var response = yield dbHelper.getCollection(collectionId)
       response.result.apps.length.should.equal(1)
    });

    it("should add app in not empty collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id

        updateCollection.apps = [appId]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)

        var app2Id = (yield dbHelper.createAppWithPackage(userId, "com.omv.bg")).result.id
        updateCollection.apps = [appId, app2Id]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }

        yield Server.injectThen(opts)

        var response = yield dbHelper.getCollection(collectionId)
        response.result.apps.length.should.equal(2)
    });

    it("should not add non existing app", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = "1234567890"

        updateCollection.apps = [appId]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)

        var response = yield dbHelper.getCollection(collectionId)
        response.result.apps.length.should.equal(0)
    });

    it("should get apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        updateCollection.apps = [appId]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)


        var response = yield dbHelper.getCollection(collectionId)
        response.result._id.toString().should.equal(collectionId.toString())
    });

    it("should get available collections for app", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var collection2Id = (yield dbHelper.createAppsCollection(userId)).result.id

        updateCollection.apps = [appId]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)

        var opts = {
            method: 'GET',
            url: '/app-collections/available?appId=' + appId + "&userId=" + userId,
        }
        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.eq(1)
        String(response.result.collections[0]._id).should.eq(collection2Id)
    });

    it("should get apps collection with sorted by votesCount apps", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("mailmail")).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "packpack")).result.id

        yield dbHelper.voteApp(app2Id, user2Id)

        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        updateCollection.apps = [appId, app2Id]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)


        var response = yield dbHelper.getCollection(collectionId)
        var apps = response.result.apps
        apps[0]._id.toString().should.equal(app2Id.toString())
        apps[1]._id.toString().should.equal(appId.toString())
    });

    it("should get all apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        yield dbHelper.createAppsCollection(userId)
        yield dbHelper.createAppsCollection(userId)

        var opts = {
            method: 'GET',
            url: '/app-collections'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(2)
        response.result.totalCount.should.equal(2)
    });


    it("should get paged apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        yield dbHelper.createAppsCollection(userId)
        yield dbHelper.createAppsCollection(userId)

        var opts = {
            method: 'GET',
            url: '/app-collections?page=1&pageSize=1'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
        response.result.totalCount.should.equal(2)
    });

    it("should search for collections", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("mailmail")).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "packpack")).result.id

        yield dbHelper.voteApp(app2Id, user2Id)

        var collectionResponse = yield dbHelper.createAppsCollection(userId)
        var collectionId = collectionResponse.result.id
        updateCollection.name = collectionResponse.result.name
        updateCollection.apps = [appId, app2Id]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)


        var name = collectionResponse.result.name

        var opts = {
            method: 'GET',
            url: '/app-collections/search?q=Top'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
        var apps = response.result.collections[0].apps
        apps[0]._id.toString().should.equal(app2Id.toString())
        apps[1]._id.toString().should.equal(appId.toString())

    });

    it("should remove app from apps collection", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "tctctc")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        updateCollection.apps = [appId, app2Id]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)

        opts = {
            method: 'DELETE',
            url: '/app-collections/apps?collectionId=' + collectionId + "&appId=" + app2Id
        }

       yield Server.injectThen(opts)

        var response = yield dbHelper.getCollection(collectionId)
        var apps = response.result.apps
        apps.length.should.equal(1)
        apps[0]._id.toString().should.equal(appId)
    });

    it("should remove app collection", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var app2Id = (yield dbHelper.createAppWithPackage(userId, "tctctc")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        updateCollection.apps = [appId, app2Id]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)


        var opts = {
            method: 'DELETE',
            url: '/app-collections?collectionId=' + collectionId
        }
        var response = yield Server.injectThen(opts)
        var opts = {
            method: 'GET',
            url: '/app-collections?page=1&pageSize=1'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(0)
    })

    it("should favourite app collection", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        var favouriteResponse = yield dbHelper.favouriteCollection(collectionId, userId)
        favouriteResponse.result.statusCode.should.equal(STATUS_CODES.OK)

        var response = yield dbHelper.getCollection(collectionId)
        response.result.favouritedBy.length.should.eq(1)
    })

    it("should make app collection public", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createAppWithPackage(userId, "com.omnomnom")).result.id
        var appId2 = (yield dbHelper.createAppWithPackage(userId, "com.tyga")).result.id
        var appId3 = (yield dbHelper.createAppWithPackage(userId, "com.shtastie")).result.id
        var appId4 = (yield dbHelper.createAppWithPackage(userId, "com.sadpanda")).result.id

        updateCollection.apps = [appId, appId2, appId3, appId4]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)

        var response = yield dbHelper.getCollection(collectionId)
        response.result.status.should.eq(COLLECTION_STATUSES.PUBLIC)
    })

    it("should make app collection private", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var appId = (yield dbHelper.createAppWithPackage(userId, "com.omnomnom")).result.id
        var appId2 = (yield dbHelper.createAppWithPackage(userId, "com.tyga")).result.id
        var appId3 = (yield dbHelper.createAppWithPackage(userId, "com.shtastie")).result.id
        var appId4 = (yield dbHelper.createAppWithPackage(userId, "com.sadpanda")).result.id

        updateCollection.apps = [appId, appId2, appId3, appId4]
        var opts = {
            method: 'PUT',
            url: '/app-collections/' + collectionId + "?userId=" + userId,
            payload: {
                collection: updateCollection
            }
        }
        yield Server.injectThen(opts)

        var opts = {
            method: 'DELETE',
            url: '/app-collections/apps?collectionId=' + collectionId + '&appId=' + appId,
        }

        var response = yield Server.injectThen(opts)
        response.result.statusCode.should.eq(STATUS_CODES.OK)
    })

    it("should get apps collection with status", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        var opts = {
            method: 'GET',
            url: '/app-collections?status=draft'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.equal(1)
    });

    it("should get apps collection sorted", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasdasdasdasd")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        yield dbHelper.voteAppsCollection(collectionId, user2Id)
        var collection2Id = (yield dbHelper.createAppsCollection(userId)).result.id

        var opts = {
            method: 'GET',
            url: '/app-collections?sortBy=date'
        }

        var response = yield Server.injectThen(opts)
        response.result.collections[0]._id.toString().should.eq(collection2Id)

        opts = {
            method: 'GET',
            url: '/app-collections?sortBy=vote'
        }

        response = yield Server.injectThen(opts)
        response.result.collections[0]._id.toString().should.eq(collectionId)
    });

    it("should get favourite apps collection for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var collection2Id = (yield dbHelper.createAppsCollection(userId)).result.id

        yield dbHelper.favouriteCollection(collectionId, userId)
        yield dbHelper.favouriteCollection(collection2Id, userId)


        var opts = {
            method: 'GET',
            url: "/app-collections/favourites?userId=" + userId,
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.eq(2)
        response.result.collections[0].hasVoted.should.exist()
    });

    it("should get apps collection for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("sas")).result.id
        yield dbHelper.createAppsCollection(userId)
        yield dbHelper.createAppsCollection(userId)
        yield dbHelper.createAppsCollection(user2Id)


        var opts = {
            method: 'GET',
            url: "/app-collections/mine?userId=" + userId,
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.eq(2)
    });

    it("should get apps collection for another user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("sas")).result.id
        var collection = (yield dbHelper.createAppsCollection(userId)).result
        var collection2 = (yield dbHelper.createAppsCollection(userId, "Test 2")).result
        var appIds = yield dbHelper.createFourAppsWithIds(userId)
        yield dbHelper.makeCollectionPublic(userId, collection.id, appIds)
        yield dbHelper.makeCollectionPublic(userId, collection2.id, appIds)
        yield dbHelper.voteAppsCollection(collection2.id, user2Id)


        var opts = {
            method: 'GET',
            url: "/users/"+userId+"/collections?userId=" + user2Id + '&page=1&pageSize=20',
        }

        var response = yield Server.injectThen(opts)
        var ids = []
        for(var i =0; i < response.result.collections.length;i++) {
            ids.push(String(response.result.collections[i]._id))
            if(String(response.result.collections[i]._id) == String(collection2.id)) {
                response.result.collections[i].hasVoted.should.eq(true)
            }
        }

        _.contains(ids, String(collection.id)).should.eq(true)
        _.contains(ids, String(collection2.id)).should.eq(true)

    });

    it("should get paginated collections for user", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("sas")).result.id
        var collection1 = (yield dbHelper.createAppsCollection(userId)).result
        var collection3 = (yield dbHelper.createAppsCollectionWithParams(userId, "Blah")).result
        var collection2 = (yield dbHelper.createAppsCollection(user2Id)).result
        var appIds = yield dbHelper.createFourAppsWithIds(userId)

        yield dbHelper.makeCollectionPublic(userId, collection1.id, appIds)
        yield dbHelper.makeCollectionPublic(userId, collection3.id, appIds)
        yield dbHelper.makeCollectionPublic(userId, collection2.id, appIds)

        yield dbHelper.voteAppsCollection(collection2.id, userId)
        yield dbHelper.favouriteCollection(collection1.id, userId)

        var opts = {
            method: 'GET',
            url: "/users/"+userId + "/collections?page=1&pageSize=1"
        }

        var response = yield Server.injectThen(opts)
        response.result.totalPages.should.eq(2)
        response.result.totalCount.should.eq(2)
        response.result.collections.length.should.eq(1)
        var collectionId = String(response.result.collections[0]._id)
        expect([collection1.id, collection2.id, collection3.id]).to.contain(collectionId)
    })

    it("should get apps collection with hasVoted for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("sas")).result.id
        yield dbHelper.createAppsCollection(userId)
        yield dbHelper.createAppsCollection(userId)
        yield dbHelper.createAppsCollection(user2Id)

        var opts = {
            method: 'GET',
            url: "/app-collections?userId=" + userId + "&page=1&pageSize=10",
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.eq(3)
        var numOfVotes = 0
        for(var i=0; i < response.result.collections.length; i++) {
            var collection = response.result.collections[i]
            if(collection.hasVoted == true && String(collection.createdBy._id) == String(userId)) {
                numOfVotes++;
            }
        }
        numOfVotes.should.eq(2)
    });

    it("should get favourite apps within all apps collection for user", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id
        var collection2Id = (yield dbHelper.createAppsCollection(userId)).result.id

        yield dbHelper.favouriteCollection(collectionId, userId)
        yield dbHelper.favouriteCollection(collection2Id, userId)


        var opts = {
            method: 'GET',
            url: "/app-collections?userId=" + userId + "&page=1&pageSize=10",
        }

        var response = yield Server.injectThen(opts)
        response.result.collections.length.should.eq(2)
        for(var i in response.result.collections) {
            var collection = response.result.collections[i]
            collection.isFavourite.should.eq(true)
        }
    });

    it("should unfavourite app collection", function* () {
        var userId = (yield dbHelper.createUser()).result.id
        var collectionId = (yield dbHelper.createAppsCollection(userId)).result.id

        var favouriteResponse = yield dbHelper.favouriteCollection(collectionId, userId)
        favouriteResponse.result.statusCode.should.equal(STATUS_CODES.OK)

        var opts = {
            method: 'DELETE',
            url: '/app-collections/' + collectionId + '/actions/favourite?userId=' + userId
        }

        var response = yield Server.injectThen(opts)
        response.result.statusCode.should.eq(STATUS_CODES.OK)

        var opts2 = {
            method: 'GET',
            url: "/app-collections/favourites?userId=" + userId,
        }

        var response2 = yield Server.injectThen(opts2)
        response2.result.collections.length.should.eq(0)
    })

    it("should create banner", function* () {
        var banner = (yield dbHelper.createBanner("test")).result.id
        var opts2 = {
            method: 'GET',
            url: "/app-collections/banners",
        }

        var response2 = yield Server.injectThen(opts2)
        response2.result.banners[0].should.eq('test')
    })
})

