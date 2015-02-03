var Querystring = require('querystring')
var Request = require('request-promise')
var config = require('../config')

function* getShortLink(link) {
    var query = Querystring.stringify({
        access_token: config.bitly.apiKey,
        longUrl: link
    })
    var options = {
        uri: config.bitly.url + query,
        method: "GET"
    }
    var result = JSON.parse(yield Request(options))
    if(result.status_code == 304 || result.status_code == 200) {
        return result.data.link_save.link
    }

    return null
}

module.exports.getShortLink = getShortLink