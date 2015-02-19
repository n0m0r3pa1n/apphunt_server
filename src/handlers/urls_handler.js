var HuntMe = require('huntme-node')

function* getShortLink(link) {
    var huntMe = new HuntMe("")
    return yield huntMe.createLink(link, "Android")
}

module.exports.getShortLink = getShortLink
