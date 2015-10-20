'use strict';

var HISTORY_EVENT_TYPES = require('./config').HISTORY_EVENT_TYPES;
var APP_REJECTED_TITLE = '{0} is rejected';
var APP_REJECTED_MESSAGE = 'Your submission does not meet AppHunt\'s criteria. The app should be new and with description in English.';

var FOLLOWING_APP_APPROVED_TITLE = '{0} added an app';
var FOLLOWING_APP_APPROVED_MESSAGE = '{0} is now on AppHunt';

var APP_APPROVED_TITLE = '{0} is approved';
var APP_APPROVED_MESSAGE = '{0} will be featured on AppHunt on {1}';

var USER_COMMENTED_TITLE = '{0} commented on {1}';
var USER_MENTIONED_TITLE = '{0} mentioned you on AppHunt';

var historyMessages = {};

historyMessages[HISTORY_EVENT_TYPES.APP_APPROVED] = APP_APPROVED_TITLE;
historyMessages[HISTORY_EVENT_TYPES.APP_REJECTED] = APP_REJECTED_TITLE;
historyMessages[HISTORY_EVENT_TYPES.APP_FAVOURITED] = '{0} is favourited by {1}';

historyMessages[HISTORY_EVENT_TYPES.USER_MENTIONED] = '{0} mentioned you in {1}';
historyMessages[HISTORY_EVENT_TYPES.USER_FOLLOWED] = '{0} follows you';
historyMessages[HISTORY_EVENT_TYPES.USER_COMMENT] = '{0} commented {1}';
historyMessages[HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS] = '{0} is in Top Hunters';

historyMessages[HISTORY_EVENT_TYPES.COLLECTION_CREATED] = '{0} created collection {1}';
historyMessages[HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED] = '{0} is favourited by {1}';
historyMessages[HISTORY_EVENT_TYPES.COLLECTION_UPDATED] = '{0} is updated';

module.exports.APP_REJECTED_TITLE = APP_REJECTED_TITLE;
module.exports.APP_REJECTED_MESSAGE = APP_REJECTED_MESSAGE;

module.exports.APP_APPROVED_TITLE = APP_APPROVED_TITLE;
module.exports.FOLLOWER_APP_APPROVED_TITLE = FOLLOWING_APP_APPROVED_TITLE;
module.exports.FOLLOWING_APP_APPROVED_MESSAGE = FOLLOWING_APP_APPROVED_MESSAGE;
module.exports.APP_APPROVED_MESSAGE = APP_APPROVED_MESSAGE;

module.exports.USER_COMMENTED_TITLE = USER_COMMENTED_TITLE;
module.exports.USER_MENTIONED_TITLE = USER_MENTIONED_TITLE;

module.exports.HISTORY_MESSAGES = historyMessages;