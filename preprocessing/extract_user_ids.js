// Author: Luis Rei <luis.rei@ijs.si> http://luisrei.com @lmrei
// extract twitter unique user ids from my NDJ file or similar
// Note: there is probably a maximum size 
var fs = require('fs');
var stream = require('stream');
var JSONStream = require('JSONStream');


var contains = function(array, obj) {
  var i = array.length;
  while (i--) {
    if (array[i] === obj) {
      return true;
    }
  }
  return false;
};

var user_table = [];
var seen = function(uid) {
  if(contains(user_table, uid)) { return true; }

  user_table.push(uid);
  return false;
};


var getUserId = function(t) {
  return t.user_id_str;
};

var stream = fs.createReadStream(process.argv[2], {encoding: 'utf8'});
var parser = JSONStream.parse();
stream.pipe(parser);

parser.on('root', function(tweet) {
  var uid = getUserId(tweet);
  if(!seen(uid)) { console.log(uid); }
});
