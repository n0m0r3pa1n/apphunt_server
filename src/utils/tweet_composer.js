const TWEET_MAX_LENGTH = 140
const MAX_TWITTER_USERNAME_LENGTH = 15

var TweetComposer = function(ownerAccount) {
    this.ownerAccount = ownerAccount
    return this
}

TweetComposer.prototype.compose = function(options) {

    var appName = options.name
    var appDescription = options.description
    var shortUrl = options.url
    var username = options.user
    var hashTag = options.hashTag

    if(appName.length > 30) {
        appName = truncateText(appName, 30)
    }

    var tweet = appName + ": "

    if(appDescription.length > 45) {
        appDescription = truncateText(appDescription, 45, "...")
    }

    tweet += appDescription + " "
    tweet += shortUrl
    if(username !== undefined) {
        tweet += " via @" + username
    }
    tweet += " on @" + this.ownerAccount

    var charsLeft = TWEET_MAX_LENGTH - tweet.length

    var hashTag = " #" + hashTag
    if(charsLeft > hashTag.length) {
        tweet += hashTag
    }
    
    return tweet
}

function truncateText(text, maxChars, appendString) {

    text = text.substring(0, maxChars)
    text = text.substring(0, text.lastIndexOf(" "))
    if(appendString !== undefined) {
        text += appendString
    }
    return text
}


module.exports = TweetComposer
