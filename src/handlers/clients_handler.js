var Mongoose = require('mongoose')
var Crypto = require('crypto')
var Client = require('../models').Client

function getHash(hashString) {
    return Crypto.createHash("md5").update(hashString).digest("hex")
}

function* create(username, password) {

    var buffer = Crypto.randomBytes(10)
    var appSpiceId = buffer.toString('hex')

    var client = yield Client.findOne({username: username}).exec()

    if(client) {
        return {statusCode: 400}
    } else {
        return yield Client.create({
            username: username,
            password: getHash(password),
            appSpiceId: appSpiceId,
            spiceCoins: 100
        })
    }
}

function* get(appSpiceId) {
    return yield Client.findOne({appSpiceId: appSpiceId}, "-password").exec()
}

function* getClientAppSpiceId(username, password) {
    var appSpiceId = yield Client.findOne({username: username, password: getHash(password)}, "appSpiceId").exec()
    if(appSpiceId) {
        return appSpiceId
    } else {
        return {statusCode: 404}
    }
}

module.exports.create = create
module.exports.get = get
module.exports.getClientAppSpiceId = getClientAppSpiceId