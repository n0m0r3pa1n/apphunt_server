var Mongoose = require('mongoose')
var DeepPopulate = require('mongoose-deep-populate');
var Schema = Mongoose.Schema
var Co = require('co')
Timestamps = require('mongoose-timestamp')
var platforms = require('./config').platforms
var appStatuses = require('./config').appStatuses
var loginTypes = require('./config').loginTypes
var _ = require("underscore")

Mongoose.plugin(function(schema) {

    schema.statics.findOneOrCreate = function findOneOrCreate(condition, doc) {
        var wrapper = Co.wrap(function* (self, condition, doc) {
            var foundDoc = yield self.findOne(condition).exec();

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
        email: {type: String, index:true, unique: true},
        profilePicture: String,
        loginType: {type: String, enum: _.values(loginTypes), default: loginTypes.Facebook},
        locale: String,
        appVersion: String,
        devices: [{type: Schema.Types.ObjectId, ref: 'Device'}]
    }
)


var appCategorySchema = new Schema(
    {
        name: {type: String, unique: true}
    }
)

var appSchema = new Schema(
    {
        name: String,
        icon: String,
        url: String,
        shortUrl: String,
        description: String,
        package: {type: String, unique: true},
        status: {type: String, enum: _.values(appStatuses), default: appStatuses.WAITING},
        createdBy: {type: Schema.Types.ObjectId, ref: 'User'},
        votes: [{type: Schema.Types.ObjectId, ref: 'Vote'}],
        categories: [{type: Schema.Types.ObjectId, ref: 'AppCategory'}],
        isFree: {type: Boolean, default: true},
        platform: {type: String, enum: _.values(platforms), default: platforms.Android}
    }
)

var voteSchema = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: 'User'}
    }
)


var commentSchema = new Schema(
    {
        text: String,
        app: {type: Schema.Types.ObjectId, ref: 'App'},
        createdBy: {type: Schema.Types.ObjectId, ref: 'User'},
        votes: [{type: Schema.Types.ObjectId, ref: 'Vote'}],
        parent: {type: Schema.Types.ObjectId, ref: 'Comment'},
        children: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
        votesCount: {type: Number, default: 0}
    }
)



appSchema.methods.getVotesCount = function () {
    return this.votes.count();
}

var notificationSchema = new Schema(
    {
        type: String,
        sendTime: Date,
        title: String,
        message: String
    }
)

var deviceSchema = new Schema({
    notificationsEnabled: { type:Boolean, default: true},
    deviceId: {type: String, unique: true}
})

userSchema.plugin(Timestamps)
appSchema.plugin(Timestamps)
voteSchema.plugin(Timestamps)
commentSchema.plugin(Timestamps)
notificationSchema.plugin(Timestamps)
appCategorySchema.plugin(Timestamps)

appSchema.plugin(DeepPopulate);
commentSchema.plugin(DeepPopulate)

module.exports.User = Mongoose.model('User', userSchema)
module.exports.App = Mongoose.model('App', appSchema)
module.exports.Vote = Mongoose.model('Vote', voteSchema)
module.exports.Comment = Mongoose.model('Comment', commentSchema)
module.exports.Notification = Mongoose.model('Notification', notificationSchema)
module.exports.Device = Mongoose.model('Device', deviceSchema)
module.exports.AppCategory = Mongoose.model('AppCategory', appCategorySchema)

