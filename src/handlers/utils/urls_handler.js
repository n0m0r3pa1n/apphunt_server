var HuntMe = require('huntme')

function* getShortLink(link) {
    var huntMe = new HuntMe("54ec824e61fc8103004a436a")
    var response = yield huntMe.createLink(link, "Android")
    return response.url
}

module.exports.getShortLink = getShortLink
