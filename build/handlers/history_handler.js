'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.createEvent = createEvent;
var _ = require('underscore');
var Boom = require('boom');
var CONFIG = require('../config/config');

var History = require('../models').History;

function* createEvent(type, userId) {
    var params = arguments[2] === undefined ? {} : arguments[2];

    yield History.create({ type: type, user: userId, params: params });
}