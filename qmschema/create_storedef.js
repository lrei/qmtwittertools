/* Creates a `store.def` file from a base schema and a set of scripts executed
 * to modify the schema.
 */

/*jslint node: true, stupid: true */
// yes i know im using sync methods, it makes the code easier to read, stupid.

var fs = require('fs');
JSON.minify = require('./lib/json.minify.js');


// print usage
if(process.argv.length === 2) {
  var scriptname = process.argv[1];
  console.log("usage: node " + scriptname + " base.def.js [mods/m1.js] ...\n");
  console.log("mods are executed in order and can be chained.\n");
  console.log("Outputs to STDOUT. Redirect to file.\n");

  console.log("example:\n");
  console.log("node " + scriptname + " twitter.def.js mods/annot_symphony.js " + 
              "mods/symphony_financial.js > symphony.def\n");

  process.exit(0);
}

var baseDefsName;
var modFileNames = [];

// get command line options, 0:node, 1;scriptname
process.argv.forEach(function (val, index) {
  if(index === 2) { 
    baseDefsName = val;
  }
  else if(index > 2) {
    modFileNames.push(val);
  }
});

/* Terminology:
 * **baseDefs**: an array of 
 *               baseDef -- the definition of a single store in the `base file`
 *
 * **modDefs**: an array of
 *              modDef -- the definition or modification of a single store in
 *                        a single `mod file`
 */

// read base file
var baseDefString = fs.readFileSync(baseDefsName, {encoding: "utf8"});
// convert to JSON
var baseDefs = JSON.parse(JSON.minify(baseDefString));

// add mods, for each mod file name
modFileNames.forEach(function(modFileName) {
  // read it: each file can have multiple store (re)defenitions
  var modDefString = fs.readFileSync(modFileName, {encoding: "utf8"});
  var modDefs = JSON.parse(JSON.minify(modDefString));

  // for each mod store in the mod file
  modDefs.forEach(function(modDef) { // does this store exist already?
    var result = baseDefs.filter(function(baseDef) {
      return baseDef.name == modDef.name;
    });

    if(result.length == 0) {
      /*
       * a) store does not exist
       * push it it, continue, to next store def in modDefs
       */
      baseDefs.push(modDef);
      return;
    } // end of modDef when store does not exist


    /* 
     * b) store exists
     */
    var baseDef = result[0]; // store name's are unique, there's only 1

    // Loop through the modStore
    for(var property in modDef) { // property = "fields", "joins" or "keys"
      if(property == "name") { continue; } // skip `name` property, duh

      // if original store does not have property, add it
      if(!(property in baseDef)) {
        if(property == "timeWindow") { 
          // `timeWindow` is different: obect not array
          baseDef.timeWindow = {}; // empty object
        }
        else {
          baseDef[property] = []; // all other properties are arrays
        }
      } // by here, we've made sure the property exists in baseDef

      // Now add/modify the original baseDef from the modDef
      if(property == "timeWindow") {
        for(var twp in modDef.timeWindow) { // twp = timeWindowProperty
          baseDef.timeWindow[twp] = modDef.timeWindow[twp];
        }
      } // end of `timeWindow`
      else if(property == "keys") { // keys just get added in
        modDef.keys.forEach(function(keyDef) {
          baseDef.keys.append(keyDef);
        });
      } // end of `keys`
      else { // `fields` and `joins` - unique "name" property
        modDef[property].forEach(function(def) { // for each field or join
          // remove if it exists
          var newBaseDefProperty = baseDef[property].filter(function(d) {
            return d.name != def.name;
          });
          baseDef[property] = newBaseDefProperty;
          
          // add new definition
          baseDef[property].push(def);
        }); // end of each field or join
      } // end of `fields` and `joins`
    } // end of this property (`timeWindow`, `fields`, `joins`, `keys`)

  }); // end of all modDefs (this mod file)
}); // end of mod files


// stringify and write final store def file
var baseDefString = JSON.stringify(baseDefs, null, 2);
process.stdout.write(baseDefString);
