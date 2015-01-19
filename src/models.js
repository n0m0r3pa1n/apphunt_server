var Mongoose = require('mongoose')
var Schema = Mongoose.Schema
var Co = require('co')
Timestamps = require("./timestamp_plugin")

Mongoose.plugin(function(schema) {

    schema.statics.findOneOrCreate = function findOneOrCreate(condition, doc) {
        var wrapper = Co.wrap(function* (self, condition, doc) {
            console.log("FindOne");
            var foundDoc = yield self.findOne(condition).exec();
            console.log("Doc:" + foundDoc)
            if (foundDoc) {
                return foundDoc
            } else {
                return yield self.create(doc)
            }
        })

        var self = this
        return wrapper(self, condition, doc)
    };
});

var userSchema = new Schema(
    {
        name: String,
        email: {type: String, index: true},
        profilePicture: String,
        advertisingId: String,
        loginType: String,
        notificationsEnabled: Boolean
    }
)


var appSchema = new Schema(
    {
        title: String,
        icon: String,
        url: String,
        description: String,
        createdBy: {type: Schema.Types.ObjectId, ref: 'User'},
        votes: [{type: Schema.Types.ObjectId, ref: 'Vote'}]
    }
)

var voteSchema = new Schema(
    {
        userId: {type: Schema.Types.ObjectId, ref: 'User'}
    }
)

appSchema.methods.getVotesCount = function () {
    return this.votes.count();
}

var notificationSchema = new Schema(
    {
        sendTime: Date,
        message: String
    }
)

userSchema.plugin(Timestamps)
appSchema.plugin(Timestamps)
voteSchema.plugin(Timestamps)
notificationSchema.plugin(Timestamps)

module.exports.User = Mongoose.model('User', userSchema)
module.exports.App = Mongoose.model('App', appSchema)
module.exports.Notification = Mongoose.model('Notification', notificationSchema)

