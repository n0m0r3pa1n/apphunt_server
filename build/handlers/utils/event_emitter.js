'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var EventEmitter = require('events');
var notifier = null;

var EventEmitter = getNotifier();

exports.EventEmitter = EventEmitter;
function getNotifier() {
    if (notifier == null) {
        notifier = new EventEmitter();
    }

    return notifier;
}