// Parse command line options
exports.cmdParse = function(argv) {
  var cmd;
  var cmdVal;
  var tmp;
  var cmdObj = {};
  var ii;
  var arg;

  var normalize = function(cmd) {
    // ignore '-' at the beggining: `-load` and `load` are the same
    if(cmd.slice(0, 1) === '-') { cmd = cmd.slice(1, cmd.length); }
    // ignore case
    cmd = cmd.toLowerCase();
    return cmd;
  };

  for(ii = 0; ii< argv.length; ii++) {
    arg = argv[ii];
    // command opts are separated from the command with `=` (equals)
    if(arg.indexOf('=') !== -1) {
      tmp = arg.split('=');
      cmd = tmp[0]; 
      // cmd options?
      if (tmp.length > 1) {
        cmdVal = tmp[1];
      }
      else {
        cmdVal = null;
      }

      // normalize
      cmd = normalize(cmd);

      // command opts are separated by `,` (comma): -load=a,b,c
      cmdObj[cmd] = [];
      if(cmdVal) {
        cmdObj[cmd] = cmdVal.split(',');
      }
      
      // no empty cmd options
      cmdObj[cmd] = cmdObj[cmd].filter(function(opt) {
        return opt !== '';
      });
    }
    // commands without options
    else {
      cmd = normalize(arg);
      cmdObj[cmd] = cmdObj[cmd] = true;
    }
  }
  return cmdObj;
};

