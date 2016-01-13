var HuntMe = require('huntme')

function* getShortLink(links) {
    try {
    var huntMe = new HuntMe("54ec824e61fc8103004a436a")
    var response = yield huntMe.createLink(links)
    } catch (e) {
        console.log(e)
    }
    return response.url
}

module.exports.getShortLink = getShortLink
