// Author: Luis Rei
// Reads tweet objects (NDJ) from stdin removes stuff, sends it to stdout
// Removes:
//   - user object
//   - places
//   - integer ids
//   - random stuff
//   - perspectival stuff (shouldnt be there)
// Converts:
//   - urls from object to simple list of expanded urls
//   - user_mentions to simple id strings in mention_ids
//   - entities.hashtags to hashtags text array at top level (same for symbols)
// Creates if retweet:
//   - t.retweeted_id (str)
//   - retweeted_user_id (str)
// Run: node tweetclean.js [input] > [output]

var fs = require('fs');
var stream = require('stream');
var JSONStream = require('JSONStream');


var cleanTweet = function(t) {
  var key;
  var user_id = t.user.id_str;
  var tweet_id = t.id_str;
  var retweet_id;
  var retweet_user_id;
  
  // handle retweets, replaces status with retweeted status
  if('retweeted_status' in t) {
    if(t.retweeted_status) {
      retweet_id = t.retweeted_status.id_str;
      retweet_user_id  = t.retweeted_status.user.id_str;
      t = t.retweeted_status;
    }
  }

  if('annotations' in t) { delete t.annotations; }
  if('contributors' in t) { delete t.contributors; }
  if('user' in t) { delete t.user; }
  if('filter_level' in t) { delete t.filter_level; }
  if('id' in t) { delete t.id; }
  if('in_reply_to_status_id' in t) { delete t.in_reply_to_status_id; }
  if('in_reply_to_user_id' in t) { delete t.in_reply_to_user_id; }
  if('scopes' in t) { delete t.scopes; }
  if('source' in t) { delete t.source; }
  if('truncated' in t) { delete t.truncated; }
  if('possibly_sensitive' in t) { delete t.possibly_sensitive; }
  if('witheld_copyright' in t) { delete t.witheld_copyright; }
  if('witheld_in_countries' in t) { delete t.witheld_in_countries; }
  if('witheld_scope' in t) { delete t.witheld_scope; }
  if('place' in t) { delete t.place; }
  // perspectival
  if('favorited' in t) { delete t.favorited; }
  if('current_user_retweet' in t) { delete t.current_user_retweet; }
  if('retweeted' in t) { delete t.retweeted; }

  // entities
  if('entities' in t) {
    // convert urls
    var urls = t.entities.urls || [];
    var simple_urls = urls.map(function(u) {
      return u.expanded_url;
    });
    if(simple_urls.length) { t.urls = simple_urls; }

    // convert mentions
    var user_mentions = t.entities.user_mentions || [];
    var mention_ids = user_mentions.map(function(m) {
      return m.id_str;
    });
    if(mention_ids.length) { t.mention_ids = mention_ids; }
    
    // convert hashtags
    var hashtags = t.entities.hashtags || [];
    var hashtext = hashtags.map(function(h) {
      return h.text;
    });
    if(hashtext.length) { t.hashtags = hashtext; }
    
    // convert symbols
    var symbols = t.entities.symbols || [];
    var symboltext = symbols.map(function(s) {
      return s.text;
    });
    if(symboltext.length) { t.symbols = symboltext; }
    
    // delete original entities array
    delete t.entities;
   }
  
  
  // remove nulls and empty arrays
  for(key in t) {
    if(t[key] === null) { delete t[key]; }
    if(t[key] === undefined) { delete t[key]; }
    if(t[key] instanceof Array) { if(t[key].length === 0) { delete t[key]; } }
  }
  
  // add or replace user id, tweet id, retweet
  t.user_id_str = user_id;
  t.id_str = tweet_id;
  if(retweet_id) {
    t.retweeted_id = retweet_id;
    t.retweeted_user_id = retweet_user_id;
  }

  return JSON.stringify(t);
};

var stream = fs.createReadStream(process.argv[2], {encoding: 'utf8'});
var parser = JSONStream.parse();
stream.pipe(parser);

parser.on('root', function(tweet) {
  var outstr = cleanTweet(tweet);
  console.log(outstr + '\n');
});
