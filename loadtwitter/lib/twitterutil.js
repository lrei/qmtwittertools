var isEmpty = function(obj) {
    return Object.keys(obj).length === 0;
};
exports.isEmpty = isEmpty;
  // convert to safe "log" format that works with linux and windows (qminer) 
var td2log = function (date_str) {
  var _parseTwitterTime = function (a) { return (a < 10) ? ("0" + a) : a; };
  var months = {};
  months["Jan"] = 1; months["Feb"] = 2; months["Mar"] = 3; months["Apr"] = 4;
  months["May"] = 5; months["Jun"] = 6; months["Jul"] = 7; months["Aug"] = 8;
  months["Sep"] = 9; months["Oct"] = 10; months["Nov"] = 11; months["Dec"] = 12;

  var date_part = date_str.split(' ');
  var year = parseInt(date_part[5], 10);
  var month = months[date_part[1]];
  var day = parseInt(date_part[2], 10);
  // prase time
  var time_part = date_part[3].split(':');
  var hour = parseInt(time_part[0], 10);
  var minute = parseInt(time_part[1], 10);
  var second = parseInt(time_part[2], 10);
  // return qminer time string
  return year + "-" +
      _parseTwitterTime(month) + "-" +
      _parseTwitterTime(day) + "T" +
      _parseTwitterTime(hour) + ":" +
      _parseTwitterTime(minute) + ":" +
      _parseTwitterTime(second);
};
exports.td2log = td2log;

// TwitterDate 'class' 
exports.TwitterDate = function(twitterDateStr) {
  this.twitterDateStr = twitterDateStr;

  // returns Date
  this.toDate = function() {
    return new Date(Date.parse(this.toISOString()));
  };

  // returns unix timestamp
  this.timestamp = function() {
    return Date.parse(this.toISOString());
  };

  this.td2log = td2log;

  // returns ISO string
  this.toISOString =function() {
    return twitterDateStr.replace(/( +)/, ' UTC$1');
  };
};
var TwitterDate = exports.TwitterDate; // internal version
exports.td2log = exports.TwitterDate.td2log;
var td2log = exports.TwitterDate.td2log;

// convenience function for TwitterDate.toISOString()
exports.td2iso = function(text) {
    return text.replace(/( +)/, ' UTC$1');
};

// Check if an object with a given date (d)
// is more recent than the store object (o)
exports.isNewer = function(td, o) {
  if(!o) { return true; }  // o does not exist
  if(!o.last_modified) { return true; } // doesnt have a last_modified date

  var o_date = new Date(o.last_modified);
  var td_date = new Date(td);
  if(td_date > o_date) { return true; }
  return false;
};
var isNewer = exports.isNewer;

// Twitter Entities
exports.readEntities = function(td) {
  if(!td.entities) { return {}; }
  var es = td.entities; // entities
  var qes = {};         // entity objects for QMiner

  if(es.hashtags) {
    qes.hashtags = [];
    es.hashtags.forEach(function(h) {
      qes.hashtags.push({'text': h.text});
    });
  } // /hashtags
  if(es.symbols) {
    qes.symbols = [];
    es.symbols.forEach(function(s) {
      qes.symbols.push({'text': s.text});
    });
  } // /symbols
  if(es.urls) {
    qes.urls = es.urls;
    qes.urls = qes.urls.filter(function(u) {
      return !isEmpty(u);
    });
  } // /urls
  if(es.media) {
    qes.media = [];
    es.media.forEach(function(m) {
      var qme = {};
      qme.id_str = m.id_str;
      if('media_url' in m) { qme.media_url = m.media_url; }
      if('url' in m) { qme.url = m.url; }
      if('display_url' in m) { qme.display_url = m.display_url; }
      if('expanded_url' in m) { qme.expanded_url = m.expanded_url; }
      if('type' in m) { qme.type = m.type; }
      // Media Sizes
      if('sizes' in m) {
        qes.media.sizes = [];
        for(var key in m.sizes) {
          if(!m.sizes[key]) { continue; }
          var w = m.sizes[key].w || null;
          var h = m.sizes[key].h || null;
          var resize = m.sizes[key].resize || null;
          qes.media.sizes.push({
            'size': key, 
            'w': w, 
            'h': h,
            'resize': resize
          });
        }
        qes.media.sizes = qes.media.sizes.filter(function(s) {
          return !isEmpty(s);
        });
      } // /sizes
      if(!isEmpty(qme)) { qes.media.push(qme); }
    });
  } // media
  if(es.user_mentions) {
    qes.user_mentions = [];
    es.user_mentions.forEach(function(u) {
      var qmu = JSON.parse(JSON.stringify(u));
      delete qmu.id; delete qmu.indices;
      if(qmu.id_str)
        qes.user_mentions.push(qmu);
    });
  } // /user_mentions
  
  if(!isEmpty(qes)) { return qes; }
  return null;
};
var readEntities = exports.readEntities;

// Twitter Places
exports.readPlace = function(td) {
  if(!td.place) { return {}; }
  var p = JSON.parse(JSON.stringify(td.place));

  var coordinates = null;
  if(p.bounding_box.coordinates) {
    coordinates = p.bounding_box.coordinates;
  }
  if(coordinates) {
    p.bounding_box1 = coordinates[0] || null;
    p.bounding_box2 = coordinates[1] || null;
    p.bounding_box3 = coordinates[2] || null;
    p.bounding_box4 = coordinates[3] || null;
    p.type = p.bounding_box.type;
  }
  delete p.bounding_box;

  if(p.id) { return p; }

  return null;
};

// Load a user object into the store
var doLoadUser = function(u, Users) {
  // :id - remove
  delete u.id;

  // :entities
  if('entities' in u) {
    var entities = JSON.parse(JSON.stringify(u.entities));
    u.urls = [];
    if(t.entities.urls) {
      entities.urls.forEach(function(url) {
        if(url.url)
          u.urls.push(url);
      });
    }
    if('description' in entities) {
      if(entities.description.urls) {
        entities.description.urls.forEach(function(url) {
          if(url.url)
            u.urls.push(url);
        });
      }
    }
  }
  delete u.entities;

  // :created_at
  if(u.created_at) { u.created_at = td2log(u.created_at); }
  else { u.created_at = null; }


  // Store
  if(u.id_str) {
    Users.add(u);
  }
  else {
    throw new Error('doLoadUser could not load: ' + json.stringify(u));
  }
};

// Load a full user object, verify date_modified
// User objects can come from being embedded in tweets or from directly getting
// the user's profile
exports.loadUser = function(u, date, Users) {
  var user = Users.rec(u.id_str);
  
  if(user) { // exists in store
    if(user.created_at) { // full representation in store
      if(isNewer(date, user)) { // is newer than stored
        u.last_modified = date;
        doLoadUser(u, Users);
      }
    } 
    else { // partial representation in store 
      if(isNewer(date, user)) {
        u.screen_name = screen_name;
        u.last_modified = date;
      }
      doLoadUser(u, Users);
    }
  }
  else { // no representation in store
    u.last_modified = date;
    doLoadUser(u, Users);
  }
};
