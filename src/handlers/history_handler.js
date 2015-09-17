var _ = require("underscore")
var Boom = require('boom')
var CONFIG  = require('../config/config')

var History = require('../models').History


export function* createEvent(type, userId, params = {}) {
    yield History.create({type: type, user: userId, params: params})
}