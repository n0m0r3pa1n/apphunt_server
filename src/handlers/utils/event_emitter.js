var EventEmitter = require('events');
var notifier = null

export var EventEmitter = getNotifier()

function getNotifier() {
    if(notifier == null) {
        notifier = new EventEmitter()
    }

    return notifier
}
