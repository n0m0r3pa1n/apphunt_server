"use strict";

var TWEET_MAX_LENGTH = 140;
var MAX_TWITTER_USERNAME_LENGTH = 15;

var TweetComposer = function TweetComposer(ownerAccount) {
    this.ownerAccount = ownerAccount;
    return this;
};

TweetComposer.prototype.compose = function (options) {

    var appName = options.name;
    var appDescription = options.description;
    var shortUrl = options.url;
    var username = options.user;
    var hashTag = options.hashTag;

    if (appName.length > 30) {
        appName = truncateText(appName, 30);
    }

    var tweet = appName + ": ";

    if (appDescription.length > 45) {
        appDescription = truncateText(appDescription, 45, "...");
    }

    tweet += appDescription + " ";
    tweet += shortUrl;
    if (username !== undefined) {
        tweet += " via @" + username;
    }
    tweet += " on @" + this.ownerAccount;

    var charsLeft = TWEET_MAX_LENGTH - tweet.length;

    var hashTag = " #" + hashTag;
    if (charsLeft > hashTag.length) {
        tweet += hashTag;
    }

    return tweet;
};

TweetComposer.prototype.composeWelcomeTweet = function (options) {
    var username = options.username;
    var hashTags = options.hashTags !== undefined ? options.hashTags : [];

    var tweet = "@" + username + " ";
    tweet += "Welcome to @" + this.ownerAccount + " :) Would you like to start the hunt by adding and discussing your favourite app? ";
    hashTags.forEach(function (tag) {
        tweet += "#" + tag + " ";
    });

    return tweet;
};

function truncateText(text, maxChars, appendString) {

    text = text.substring(0, maxChars);
    text = text.substring(0, text.lastIndexOf(" "));
    if (appendString !== undefined) {
        text += appendString;
    }
    return text;
}

module.exports = TweetComposer;