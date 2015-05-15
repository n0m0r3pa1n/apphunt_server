var HuntMe = require('huntme')

function* getShortLink(link, platform) {
    var huntMe = new HuntMe("54ec824e61fc8103004a436a")
    var response = yield huntMe.createLink(link, platform)
    return response.url
}

module.exports.getShortLink = getShortLink
