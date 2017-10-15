/**
 * Created by arunp on 17-Feb-17.
 */
var mongoose = require( 'mongoose' );
var conf = require('../config.json');
var url = conf.database;

// if OPENSHIFT env variables are present, use the available connection info:
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
    mongoPassword = process.env[mongoServiceName + '_PASSWORD']
mongoUser = process.env[mongoServiceName + '_USER'];

if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
        mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;

}
}
if (mongoose.connection.readyState == 0) {
mongoose.connect(mongoURL);
}

var Schema   = mongoose.Schema;
var userSchema = new Schema({
    device_id    : {
        type:String,
        unique: true,
        index: true
    },
    gcm_token : String,
    email : String,
    debug_info : String

});
var User = mongoose.model("User",userSchema);
module.exports = User;
