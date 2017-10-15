//  OpenShift sample Node application
var express = require('express'),
  app = express(),
  morgan = require('morgan');
var https = require('https');
var http = require('http');
var gcm = require('node-gcm');
var bodyParser = require("body-parser");
var mongooseFunc = require('./Mongodb/Functions');
var Post = require('./models/Post');

Object.assign = require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
  mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
  mongoURLLabel = "";

app.get('/', function (req, res) {
  res.render('index.html', { pageCountMessage: null });

});

app.get('/privacypolicy', function (req, res) {
  res.sendFile('privacypolicy.html', { root: __dirname });
});

app.get('/getComment', function (req, res) {
  //	console.log(req.query);
  var options = {
    host: 'graph.facebook.com',
    path: '/' + req.query.id + '/comments?fields=attachment,from,message',
    headers: { 'Authorization': 'OAuth 221344914931261|05bc5c77375ae3c1943f9cb54e1ba9bd' },
    method: 'GET'
  };

  res.setHeader('Content-Type', 'application/json');

  var callback = function (response) {
    var str = ''
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      str += chunk;
    });
    response.on('end', function () {
      res.send(str);
    });
  }

  var fReq = https.request(options, callback);
  fReq.end();
});

app.post('/gcmregister', function (req, res) {
  mongooseFunc.saveUserToMongo(req.body.id, req.body.email, req.body.gcm, req.body.device_info, function () {
    res.send(200);
  });

});

app.get('/getmemes', function (req, res) {
  var perPage = 10
    , page = Math.max(0, req.param('page') - 1);

  Post.find()
    .select('id fb_id provider attachments')
    .limit(perPage)
    .skip(perPage * page)
    .sort({
      id: 'desc'
    })
    .exec(function (err, events) {
      Post.count().exec(function (err, count) {
        res.send({
          posts: events,
          page: page,
          pages: count / perPage
        });
      });
    });

});
// error handling
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;



var providerList = ["Troll.Malayalam", "InternationalChaluUnion"];
var faceUrl = '';

function startRequst() {
    request(0);
    request(1);
}

function request(providerPos) {


    if (providerPos != providerList.length) {
        var provider = providerList[providerPos];
        console.log(provider);
        console.log(providerPos);
        console.log(providerList.length);
        getData(provider,"",false);
    }
}

function getData(provider,url,bool) {
    var options = {
        host: 'graph.facebook.com',
        path: '/v2.6/' + provider + '/feed?fields=likes.limit(0).summary(true){name},attachments,comments.limit(10),created_time',
        headers: { 'Authorization': 'OAuth 221344914931261|05bc5c77375ae3c1943f9cb54e1ba9bd' },
        method: 'GET'

    };
    if(bool){
        options.path = url;
    }
    console.log(provider);
    var callback = function(response) {
        var str = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            str += chunk;
        });

        response.on('end', function() {

            var obj = JSON.parse(str);
            // console.log(obj.data);
            faceUrl = obj.paging.next.replace('https://graph.facebook.com', '');
            console.log(faceUrl);
            addToDatabase(obj.data,provider);

        });
    }

    var req = https.request(options, callback);
    req.end();
}




function addToDatabase(dataArray,provider) {

    var postData = [];
    for (var ke in dataArray) {
        if (dataArray.hasOwnProperty(ke)) {
            var item = new Object();
            item = dataArray[ke];
            item.provider = provider;

            var date = new Date(item.created_time);
            var timestamp = (date.getTime()) / 1000
            console.log(timestamp);
            item.fb_id = item.id;
            item.id = timestamp;
            delete item.created_time;
            if (item.comments == null) {
                item.comments = {};
            }
            if (item.likes == null) {
                item.likes = {};
            }
            if (item.attachments == null) {
                item.attachments = {};
            }

            try {
                //console.log(item.attachments.data[0].media.image.src);
                var postItem = new Post({
                    id: String(item.id),
                    fb_id: String(item.fb_id),
                    attachments: String(item.attachments.data[0].media.image.src),
                    provider: String(item.provider)
                });
                postData.push(postItem);
            } catch (e) {
                console.log(e);

            }
        }
    }

    mongooseFunc.savePostsToMongo(postData,function (newPost) {
        if(newPost) sendNotification();
       // getData(provider,faceUrl,true);
    });
}

startRequst();

var minutes = 5;
var the_interval = minutes * 60 * 1000;

setInterval(function () {
    console.log("I am doing my 5 minutes facebook check");
    startRequst();
    // do your stuff here
}, the_interval);

function sendNotification() {
    sendMessageToUser("memes","Instachali posted new memes");
}

function sendMessageToUser(topic, message) {
  
  var fReq = https.request({
    host: 'fcm.googleapis.com',
    path: '/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type' :' application/json',
      'Authorization': 'key=AAAA8-FZqGE:APA91bFZorHuw7HHCYvB5_GE588D-dRlG-3jidLwOsI6JSgsKoGmnKtBnhJJWFy5A3onF9yEPlKRIHNxCCaT4a8_1_KfLyePQ9pQGrUcek_JjKPVWORTbM529TlxU4RYQ6JmNFUCsn_9'
    }
  }, function(response) {
    
        var str = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            str += chunk;
        });

        response.on('end', function() {
            console.log('Done! '+str);

        });
    });

    var postData =  { "data": {
        "message": message
      },
        "to": "/topics/"+topic
      };
    fReq.write(JSON.stringify(postData));

    fReq.end();


}
sendNotification();

