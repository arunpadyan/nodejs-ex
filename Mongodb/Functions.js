/**
 * Created by arunp on 17-Feb-17.
 */
var Post = require('../models/Post');
var User = require('../models/User');

module.exports = {
    savePostsToMongo: function (dataArray, finished) {
        var result = [];
        var x = 0;

        var loopArray = function(dataArray) {
            var newPost = false;
            customAlert(dataArray[x],function(newPostAdded){
                if(!newPostAdded) newPost = true;
                x++;
                if(x < dataArray.length) {
                    loopArray(dataArray);
                }else{
                    console.log("All Saved");
                    console.log(result);
                    finished(newPost);
                }
            });
        }

        function customAlert(item,callback) {
            var doc = new Post({
                id: String(item.id),
                fb_id: String(item.fb_id),
                attachments: String(item.attachments),
                provider: String(item.provider)
            });


            var docJson = {fb_id: doc.fb_id, attachments: doc.attachments, provider: doc.provider};

            Post.findOneAndUpdate({id: doc.id}
                , docJson
                , {upsert: true, 'new': true,passRawResult:true}
                , function (err, numberAffected, raw) {
                    console.log(raw);
                    if (err) throw err;//handle error
                    callback(raw.lastErrorObject.updatedExisting);
                });

            // do callback when ready

        }
        loopArray(dataArray);


    },

    saveUserToMongo: function (device_id, email, gcm_token, debug_info,callback) {
        var docJson = {
            device_id: device_id,
            gcm_token: gcm_token,
            email: email,
            debug_info: debug_info
        };
        User.findOneAndUpdate({device_id: device_id}
            , docJson
            , {upsert: true, 'new': true}
            , function (err, saved) {
                if (err) throw err;//handle error
                //result.push(saved[0]);
                callback();
                console.log("user saved Saved");

            });


    }
};

