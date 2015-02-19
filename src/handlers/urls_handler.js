var HuntMe = require('huntme-node')

function* getShortLink(link) {
    var huntMe = new HuntMe("")
    var response = yield huntMe.createLink(link, "Android")
    return response.link
}

module.exports.getShortLink = getShortLink
