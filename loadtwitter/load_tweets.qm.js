// QMiner Script for loading tweets
// Author: Luis Rei <luis.rei@ijs.si> http://luisrei.com
// example:
// qm start -noserver -script=load_tweets.qm -verbose -file=/DATA/uk_tweets_by_location.txt
// jslint options:
/* global qm: false */
/* jshint -W089 */

var tutil = require('twitterutil.js');
var cmdParse = require('cmdparse.js');

// Open QMiner stores
var Tweets = qm.store('Tweets');
var URLs = qm.store('URLs');
var Media = qm.store('Media');
var MediaSizes = qm.store('MediaSizes');
var Hashtags = qm.store('Hashtags');
var Symbols = qm.store('Symbols');
var Users = qm.store('Users');
var Places = qm.store('Places');

// Function for loading a single tweet
var loadTweet = function(tweetstr) {
  var t;
  try {
    t = JSON.parse(tweetstr);
  }
  catch(err) {
    throw err;
  }

  // :annotations (twitter, unused)
  if('annotations' in t) { delete t.annotations; }

  // :created_at
  if(t.created_at) { t.created_at = tutil.td2iso(t.created_at); }
  else { t.created_at = null; }
  t.last_modified = t.created_at;

  // :id_str: no need to change
  
  // check if it exists and if it should be overwritten
  if(!tutil.isNewer(t.created_at, Tweets.rec(t.id_str))) { return; }

  // :contributors
  if(t.contributors) {
    var contributors = [];
    t.contributors.forEach(function(u) {
      if(tutil.isNewer(t.created_at, Users.rec(u.id_str))) {
        u.last_modified = t.created_at;
        if(u.id_str) {
          contributors.push(u);
        }
        else {
          console.log('Contributor parsing error');
        }
      }
      else { 
        if(u.id_str)
          contributors.push({'id_str': u.id_str}); 
      }
    });
    t.contributors = contributors;
  }
  if('contributors' in t && !t.contributors) {
    delete t.contributors;
  }

  // :coordinates
  // in the old tweet schema was 'geo'
  if('geo' in t) { t.coordinates = {}; t.coordinates = t.geo; } 
  if(t.coordinates) { 
    if(t.coordinates.coordinates) {
    t.coordinates = t.coordinates.coordinates; 
    }
    else { 
      delete t.coordinates; 
    }
  }
  else { 
    delete t.coordinates; 
  }

  // : current_user_retweet - remove
  if('current_user_retweet' in t) { delete t.current_user_retweet; }

  // :entities
  if('entities' in t) { 
    var entities = tutil.readEntities(t); 
    delete t.entities;
    for(var key in entities) {
      // for users we compare with the last_modified so we never overwrite
      // newer name/screen_name
      if(key == 'user_mentions') {
        var user_mentions = [];
        if(entities.user_mentions) {  
          entities.user_mentions.forEach(function(u) {
            if(tutil.isNewer(t.created_at, Users.rec(u.id_str))) {
              u.last_modified = t.created_at;
              if(u.id_str) {
                Users.add(u);
              }
              else {
                console.log('Error Parsing user_mention');
              }
            }
            if(u.id_str)
              user_mentions.push({'id_str': u.id_str});
          });
          t.user_mentions = user_mentions;
        }
      }
      else {
        t[key] = entities[key];
      }
    }
  }

  // :favorite_count - no need to change
  
  // :favorited - remove
  if('favorited' in t) { delete t.favorited; }

  // :filter_level - no need to change

  // :id - remove
  delete t.id;

  // :in_reply_to_screen_name - remove
  if('in_reply_to_screen_name' in t) { delete t.in_reply_to_screen_name; }

  // :in_reply_to_status_id - remove
  if('in_reply_to_status_id' in t) { delete t.in_reply_to_status_id; }

  // :in_reply_to_status_id_str
  if('in_reply_to_status_id_str' in t) {
    if(t.in_reply_to_status_id_str)
      t.in_reply_to_status = {'id_str': t.in_reply_to_status_id_str};
    delete t.in_reply_to_status_id_str;
  }

  // :in_reply_to_user_id - remove
  if('in_reply_to_user_id' in t) { delete t.in_reply_to_user_id; }

  // :in_reply_to_user_id_str
  if('in_reply_to_user_id_str' in t) {
    if(t.in_reply_to_status_id_str)
      t.in_reply_to_user = {'id_str': t.in_reply_to_user_id_str};
    delete t.in_reply_to_user_id_str;
  }

  // :lang - no need to change

  // :place
  if(!t.place) { t.place = tutil.readPlace(t); }
  
  // :possibly_sensitive - no need to change

  // :scopes - remove
  if('scopes' in t) { delete t.scopes; }

  // :retweeted_count - do nothing
  
  // :retweeted_status
  if('retweeted_status' in t) {
    if(t.retweeted_status) {
      loadTweet(t.retweeted_status);
      var rt = Tweets.rec(t.retweeted_status.id_str);
      if(rt.id_str)
        t.retweeted_status = {'id_str': rt.id_str };
    }
  }
  
  // :source - do nothing

  // :text - do nothing

  // :truncated - do nothing

  // :user
  if(t.user) {
    tutil.loadUser(t.user, t.created_at, Users);
    t.user = {'id_str': t.user.id_str };
  }

  // :withheld_copyright - do nothing

  // :withheld_in_countries - do nothing

  // :withheld_scope - do nothing

  // Store
  if(t.id_str) {
    Tweets.add(t);
  }
  else {
    console.log('Tweet without id_str: ' + JSON.stringify(t));
  }
};

// Function for loading a single file in QMiner line-JSON format
var loadJSONL = function(fin, verbose) {
  verbose = verbose || false; // defaults to "silent"
  var line;
  var lineCounter = 0;
  var errCounter = 0;

  while(!fin.eof) {
    line = fin.readLine();
    try {
      loadTweet(line);
    }
    catch(err) {
      errCounter++;
      console.log('Line ' + lineCounter + ': ' + err);
    }

    // print line count
    if(verbose && (lineCounter % 10000 === 0)) {
      console.log('Processed ' + lineCounter + ' lines: ' + errCounter + ' errors');
    }
    lineCounter++;
  }
};

/*
 * Main
 */
var cmdObj = cmdParse.cmdParse(process.args);

var verbose = cmdObj.hasOwnProperty('verbose');
verbose = true;

if('dir' in cmdObj) {
  if(cmdObj.dir.length !== 0) {
    cmdObj.forEach(function(dirPath) {
      var fileList = fs.listFile(dirPath, 'json');
      fileList.forEach(function(filePath) {
       var fin = fs.openRead(filePath);
       if(verbose) {
         console.log(filePath);
       }
       loadJSONL(fin, verbose);
      });
    });
  }
}

if('file' in cmdObj) {
  if(cmdObj.file.length !== 0) {
    cmdObj.file.forEach(function(filePath) {
      if(verbose) {
        console.log(filePath);
      }
      var fin = fs.openRead(filePath);
      loadJSONL(fin, verbose);
    });
  }
}

// Stats
if(verbose) {
  console.log('Tweets = ' + Tweets.length);
  console.log('Users = ' + Users.length);
  console.log('URLs = ' + URLs.length);
  console.log('Media = ' + Media.length);
  console.log('Hashtags = ' + Hashtags.length);
  console.log('Symbols = ' + Symbols.length);
  console.log('Places = ' + Places.length);
}
