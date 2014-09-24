// extract twitter ids from my NDJ or similar
var fs = require('fs');
var stream = require('stream');
var JSONStream = require('JSONStream');


var getId = function(t) {
  return t.id_str;
};

var stream = fs.createReadStream(process.argv[2], {encoding: 'utf8'});
var parser = JSONStream.parse();
stream.pipe(parser);

parser.on('root', function(tweet) {
  var outstr = getId(tweet);
  console.log(outstr);
});
