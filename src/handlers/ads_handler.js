var _ = require("underscore")
var Boom = require('boom')

var Ad = require('../models').Ad

export function* getAd() {
    let ads = yield Ad.find({}).exec()
    if(ads.length == 0) {
        return {}
    }
    let index = Math.floor(Math.random() * ads.length)
    return ads[index]
}

export function* createAd({name, picture, link}) {
    let ad = new Ad({
        name: name,
        picture: picture,
        link: link
    })

    yield ad.save()

    return Boom.OK()
}
