// # Twitter stores
//
// Version 1.0, Aug 2014
// Authors:
// - Luis Rei <luis.rei@ijsi.si>, v1.0


// Twitter Objects represented as a qminer store definition
//  * Requires pass through JSON.minify
//  * id property has been commented out from all stores for objects where
// twitter defines it as 53+bits (i.e. > double precision). The reason is
// this is not supported by JavaScript and this v8. End-user might not be aware
// of this issue and mess up things. 
//  * Not all properties are represented (almost all are though) see store
// specific notes for details.
    
//  All stores have a last_modified extra field defined.

[
  { // ## Tweet Store
    // see [Tweet
    // Objects](https://dev.twitter.com/docs/platform-objects/tweets)
    "name": "Tweets", 
    // Notes:
    //   * Because JS does not support 64bit integers, while we are storing the
    // twitter `id` field, the primary key has been set to id_str instead.
    // Just to prevent possible future problems up (crawler) or down the line.
    // See 
    // [Twitter IDs](https://dev.twitter.com/docs/twitter-ids-json-and-snowflake)
    //   * Perspectival fields were not included in the store definition.
    //   * `scopes` field is not implemented 
    //   * Relational fields are included as joins.
    "fields": [
      // Geo Location reportted by the user/client app. 
      // Converted from (geoJSON field `coordinates`):
      //
      // <pre><code>
      // "coordinates": {
      //    "coordinates":
      //    [
      //      -75.14310264,
      //      40.05701649
      //    ],
      //    "type":"Point"
      //  }
      // </pre></code>
      { "name": "coordinates", "type": "float_pair", "null": true },
      // UTC time when this Tweet was created.
      // parsed from twitter **string** date format. 
      // For JS use the code:
      //
      // <pre><code>
      // function parseTwitterDate(text) {
      //  return new Date(Date.parse(text.replace(/( +)/, ' UTC$1')));
      //}
      // </pre></code>
      { "name": "created_at", "type": "datetime", "null": true },
      
      // favorite count
      { "name": "favorite_count", "type": "int", "null": true }, 

      // used by twitter to indicate top tweets for searches. See
      // [Introducing new metadata for Tweets](https://blog.twitter.com/2013/introducing-new-metadata-for-tweets)
      // 
      // According to the docs, this should always be present in a twitter 
      // object, however I decided to set it as optional, just in case...
      { "name": "filter_level", "type": "string", "null": true }, 

      // tweet id as 64bit int, see above
      //{ "name": "id", "type": "uint64" }, 

      // tweet id as string, *PRIMARY KEY*
      { "name": "id_str", "type": "string", "primary": true, "shortstring": true }, 

      // language represented by a [BCP 47](http://tools.ietf.org/html/bcp47)
      // language identifier or "und" if not detected. This is
      // machine-detected.
      { "name": "lang", "type": "string", "null": true, "shortstring": true, "codebook": true },
      
      // possibly sensitive, indicates that a **url** present in the tweet
      // might contain 'sensitive' content.
      { "name": "possibly_sensitive", "type": "bool", "null": true },

      // number of times retweeted
      { "name": "retweet_count", "type": "int", "null": true },

      // the utility ("app") that posted the tweet. HTML value or "web"
      { "name": "source", "type": "string", "null": true },

      // text, the content of the tweet
      { "name": "text", "type": "string", "null": true },

      // indicates whether the value of the text parameter was truncated by 
      // twitter. retweeted_status will have the full text if present.
      { "name": "truncated", "type": "bool", "null": true },
      
      // content witheld due to dmca complaint
      { "name": "witheld_copyright", "type": "bool", "null": true },

      // indicates a list of uppercase two-letter country codes this content is
      // withheld from. See
      // [New Withheld Content Fields in API Responses](https://dev.twitter.com/blog/new-withheld-content-fields-api-responses) 
      // and
      // [New Withheld Content Fields in API Responses](https://dev.twitter.com/blog/new-withheld-content-fields-api-responses)
      //
      // Non-country values for this field:
      //  * "XX" - Content is withheld in all countries
      //  * "XY" - Content is withheld due to a DMCA request.
      { "name": "witheld_countries", "type": "string_v", "null": true },

      // is the content being withheld is the "status" or a "user"?
      { "name": "witheld_scope", "type": "string", "null": true, "shortstring": true, "codebook": true  },

      // METADATA: NOT TWITTER DATA
      //  - datatime of last modification to record. not enforced
      //  - it is used by the parser when determining wether to overwrite an 
      // existing record. 
      { "name": "last_modified", "type": "datetime",  "null": true}
      

    ], 
    "joins": [
      // `has_` prefix added to all index joins 

      // contributors, still beta, authors who contributed on behalf of the
      // official author
      { "name": "contributors", "type": "index", "store": "Users", "inverse": "has_contributed_to" },

      // author of the tweet
      { "name": "user", "type": "field", "store": "Users", "inverse": "has_tweets" },

      // in_reply_to, if the tweet is a reply, this field points to the user
      // being replied to
      { "name": "in_reply_to", "type": "field", "store": "Users", "inverse": "has_replied_by" },

      // in_reply_to_status, if the tweet is a reply, this field points to the
      // status (tweet) being replied to
      { "name": "in_reply_to_status", "type": "field", "store": "Tweets", "inverse": "has_replied_by_status" },
      { "name": "has_replied_by_status", "type": "index", "store": "Tweets", "inverse": "in_reply_to_status" },

      // Place associated with tweet. See 
      // [Places](https://dev.twitter.com/docs/platform-objects/places)
      { "name": "place", "type": "field", "store": "Places", "inverse": "has_tweets" },

      // retweeted_status is a field that contains an entire tweet object if 
      // the current tweet was a retweet. it is implemented here as a join.
      // Also see `truncated` field above
      { "name": "retweeted_status", "type": "field", "store": "Tweets", "inverse": "has_retweeted_by_status" },
      
      { "name": "has_retweeted_by_status", "type": "index", "store": "Tweets", "inverse": "retweeted_status" },
      
      // Joins for `entities: {...}`
      //   - hashtags
      { "name": "hashtags", "type": "index", "store": "Hashtags", "inverse": "has_tweets" },

      //   - symbols
      { "name": "symbols", "type": "index", "store": "Symbols", "inverse": "has_tweets" },

      //   - urls
      { "name": "urls", "type": "index", "store": "URLs", "inverse": "has_tweets" },
      
       //   - media
      { "name": "media", "type": "index", "store": "Media", "inverse": "tweets" },

      //   - user_mentions
      { "name": "user_mentions", "type": "index", "store": "Users", "inverse": "has_mentions" }
    ],
    "keys": [ 
      // make searches based on text and location faster
      { "field": "text", "type": "text" },
      { "field": "coordinates", "type": "location" }
    ]
  }, 


  { // ## URL Store
    // see  [Entities in Twitter Objects](https://dev.twitter.com/docs/entities)
    "name": "URLs",
    // Notes:
    //  * Docs state that it is important to be tolerant of null/empty fields
    //  * indices not implemented here
    
    "fields": [
      // t.co URL
      // e.g. "http:\/\/t.co\/bAJE6Vom"
      { "name": "url", "type": "string", "primary": true},

      // **Not a URL** but a string to display instead of the media URL
      // e.g. "pic.twitter.com\/bAJE6Vom"
      { "name": "display_url", "type": "string", "null": true, "shortstring": true },

      // The fully resolved media URL
      // e.g. "http:\/\/twitter.com\/BarackObama\/status\/266031293945503744\/photo\/1"
      { "name": "expanded_url", "type": "string", "null": true}

    ], 

    "joins": [
      { "name": "has_tweets", "type": "index", "store": "Tweets", "inverse": "urls" },
      { "name": "has_users", "type": "index", "store": "Users", "inverse": "urls" } 

    ],

    "keys": [ ]

  },
  
    { // ## Media Store
    // see  [Entities in Twitter Objects](https://dev.twitter.com/docs/entities)
    "name": "Media",
    // Notes:
    //  * Docs state that it is important to be tolerant of null/empty fields
    //  * media sizes where implemented as joins
    //  * indices not implemented here
    
    "fields": [
      // media id as an integer
      //{ "name": "id", "type": "uint64", "null": true},

      // media id as a str
      { "name": "id_str", "type": "string", "primary": true, "shortstring": true },

      // the media URL of the media file 
      // e.g. "http:\/\/pbs.twimg.com\/media\/A7EiDWcCYAAZT1D.jpg"
      // The media_url defaults to medium but you can retrieve the media in
      // different sizes by appending  a colon + the size key 
      // e.g. http://pbs.twimg.com/media/A7EiDWcCYAAZT1D.jpg:thumb. 
      { "name": "media_url", "type": "string", "null": true},

      // t.co URL
      // e.g. "http:\/\/t.co\/bAJE6Vom"
      { "name": "url", "type": "string" },

      // **Not a URL** but a string to display instead of the media URL
      // e.g. "pic.twitter.com\/bAJE6Vom"
      { "name": "display_url", "type": "string", "null": true, "shortstring": true },

      // The fully resolved media URL
      // e.g. "http:\/\/twitter.com\/BarackObama\/status\/266031293945503744\/photo\/1"
      { "name": "expanded_url", "type": "string", "null": true},

      // type of "Media". Only "photo" *for now* (see Notes above).
      { "name": "type", "type": "string", "shortstring": true, "null": true, "codebook": true },

      // METADATA: NOT TWITTER DATA
      //  - datatime of last modification to record. not enforced
      //  - it is used by the parser when determining wether to overwrite an 
      // existing record. 
      { "name": "last_modified", "type": "datetime",  "null": true}
    ], 

    "joins": [
      { "name": "sizes", "type": "index", "store": "MediaSizes", "inverse": "media" },
      { "name": "tweets", "type": "index", "store": "Tweets", "inverse": "media" },
      { "name": "has_users", "type": "index", "store": "Users", "inverse": "urls" } 

    ],

    "keys": [ ]

  },


  { // ### Media Sizes
    "name": "MediaSizes",

    "fields": [
      // size: thumb, small, medium and large. 
      { "name": "size", "type": "string", "shortstring": true, "codebook": true},

      // width
      { "name": "w", "type": "int"},

      // height
      { "name": "h", "type": "int"},

      // resize: fit, crop
      { "name": "resize", "type": "string", "shortstring": true, "codebook": true}
    ],
    "joins": [
      { "name": "media", "type": "field", "store": "Media", "inverse": "sizes" }
    ],
    
    "keys": [ ]

  },


  { // ## Hashtags Store
    // see [Entities in Twitter Objects](https://dev.twitter.com/docs/entities)
    "name": "Hashtags", 
    "fields": [
      { "name": "text", "type": "string", "primary": true, "shortstring": true },

      // METADATA: NOT TWITTER DATA
      //  - datatime of last modification to record. not enforced
      { "name": "last_modified", "type": "datetime",  "null": true}
    ], 

    "joins": [ 
      { "name": "has_tweets", "type": "index", "store": "Tweets", "inverse" : "hashtags" }
    ],

    "keys": [
      { "field": "text", "type": "text" }
    ]
  },


  { // ## Symbols Store
    // see [Entities in Twitter Objects](https://dev.twitter.com/docs/entities)
    // at the moment, these are cashtags
    "name": "Symbols", 
    "fields": [
      { "name": "text", "type": "string", "primary": true, "shortstring": true },

      // METADATA: NOT TWITTER DATA
      //  - datatime of last modification to record. not enforced
      { "name": "last_modified", "type": "datetime",  "null": true}

    ],

    "joins": [ 
      { "name": "has_tweets", "type": "index", "store": "Tweets", "inverse" : "symbols" }
    ],

    "keys": [
      { "field": "text", "type": "text" }
    ]
  },


  { // ## Users Store
    // see [Users](https://dev.twitter.com/docs/platform-objects/users)
    "name": "Users", 
    "fields": [
      // as an account with "contributor mode" enabled?
      { "name": "contributors_enabled", "type": "bool", "null": true },

      // the UTC datetime that the user account was created on Twitter
      // see above for info about twitter datetimes
      { "name": "created_at", "type": "datetime", "null": true }, 

      // when true, indicates that the user has not altered the theme or 
      // background of their user profile.
      { "name": "default_profile", "type": "bool", "null": true }, 

      // when true, indicates that the user has not uploaded their own avatar
      { "name": "default_profile_image", "type": "bool", "null": true }, 

      // a user-defined string describing the account
      { "name": "description", "type": "string", "null": true }, 

      // number of tweets the user favorited
      { "name": "favorites_count", "type": "int", "null": true },

      // number of followers this account has
      { "name": "followers_count", "type": "int", "null": true },

      // number of users this account follows ("followings")
      // **WARNING**: this might be *occasionally* be 0!!!
      { "name": "friends_count", "type": "int", "null": true },

      // user has enabled the possibility of geotagging their Tweets
      { "name": "geo_enabled", "type": "bool", "null": true },

      // id
      //{ "name": "id", "type": "uint64" },

      // id as a str, **PRIMARY KEY**
      { "name": "id_str", "type": "string", "primary": true, "shortstring": true },

      // participant in Twitter's translator community.
      // see [Twitter's translator community](http://translate.twttr.com/)
      { "name": "is_translator", "type": "bool", "null": true },

      // user self-declared user interface language (BCP 47 code)
      { "name": "lang", "type": "string", "null": true, "shortstring": true, "codebook": true },

      // the number of public lists that this user is a member of.
      { "name": "listed_count", "type": "int", "null": true },

      // user defined location string e.g. "San Francisco, CA"
      { "name": "location", "type": "string", "null": true },

      // The hexadecimal color chosen by the user for their background
      {"name": "profile_background_color", "type": "string", "null": true, "shortstring": true},

      // a  URL pointing to the background image the user has uploaded for 
      // their profile.
      { "name": "profile_background_image_url", "type": "string", "null": true },

      // indicates that the user's profile_background_image_url 
      // should be tiled when displayed
      { "name": "profile_background_tile", "type": "bool", "null": true },

      // **HTTPS**-based URL pointing to the standard web representation of the 
      // user's uploaded profile banner. By adding a final path element of the 
      // URL, you can obtain different image sizes.
      // See [User Profile Images and Banners](https://dev.twitter.com/docs/user-profile-images-and-banners)
      { "name": "profile_banner_url", "type": "string", "null": true },

      // HTTP-based URL pointing to the user's avatar image
      { "name": "profile_image_url", "type": "string", "null": true },

      // the hexadecimal color the user has chosen to display links with in 
      // their Twitter UI
      { "name": "profile_link_color", "type": "string", "null": true, "shortstring": true },

      // the hexadecimal color the user has chosen to display sidebar borders 
      // with in their Twitter UI
      { "name": "profile_sidebar_border_color", "type": "string", "null": true, "shortstring": true },

      // the hexadecimal color the user has chosen to display text in their
      // Twitter UI
      { "name": "profile_text_color", "type": "string", "null": true, "shortstring": true },

      // the user wants their uploaded background image to be used
      { "name": "profile_use_background_image", "type": "bool", "null": true },

      // user has chosen to protect their Tweets
      // see [About Public and Protected Tweets](https://support.twitter.com/articles/14016)
      { "name": "protected", "type": "bool", "null": true },

      // screen name (e.g. lmrei)
      { "name": "screen_name", "type": "string", "shortstring": true },

      // user would like to see media inline. Somewhat disused.
      { "name": "show_all_inline_media", "type": "bool", "null": true },

      // number of tweets (including retweets) issued by the user
      { "name": "statuses_count", "type": "int", "null": true },

      // user-defined time zone string
      { "name": "time_zone", "type": "string", "shortstring": true, "null": true, "codebook": true },

      // profile url
      { "name": "url", "type": "string", "null": true },

      // The offset from GMT/UTC in seconds
      { "name": "utc_offset", "type": "int", "null": true },

      // verified account
      // see [Verified Accounts](https://support.twitter.com/articles/119135)
      { "name": "verified", "type": "bool", "null": true },

      // two-letter country codes this user is withheld from
      // see [New Withheld Content Fields in API Responses](https://dev.twitter.com/blog/new-withheld-content-fields-api-responses)
      { "name": "withheld_in_countries", "type": "string_v", "null": true },

      // indicates whether the content being withheld is the "status" or a "user."
      { "name": "withheld_scope", "type": "string", "null": true },
     
      // METADATA: NOT TWITTER DATA
      //  - datatime of last modification to record. not enforced
      //  - it is used by the parser when determining wether to overwrite an 
      // existing record. 
      { "name": "last_modified", "type": "datetime",  "null": true}
 
    ], 

    "joins": [ 
      // Joins for Tweets Store
      { "name": "has_tweets", "type": "index", "store": "Tweets", "inverse" : "user" }, 
      
      { "name": "has_contributed_to", "type": "index", "store": "Tweets", "inverse": "contributors" },

      { "name": "has_replied_by", "type": "index", "store": "Tweets", "inverse": "in_reply_to" },

      { "name": "has_mentions", "type": "index", "store": "Tweets", "inverse": "user_mentions" },

      // Joins for User Store
      // urls parsed from the url or description field
      { "name": "urls", "type": "index", "store": "URLs", "inverse" : "has_users" } 
    ],

    "keys": [ 
      { "field": "screen_name", "type": "text" },
      { "field": "description", "type": "text" }
    ] 
  },


    { // ## Places
    // see [Places](https://dev.twitter.com/docs/platform-objects/places)
    "name": "Places", 
    // Notes:
    //   * `coordinates` was flattened to 4 float_pairs (i.e. geo) without
    //  `coordinates.type`.
    //  * ** Geo Place Attrbutes NOT implemented. ** it looked weird, see 
    //  [https://dev.twitter.com/docs/about-geo-place-attributes](https://dev.twitter.com/docs/about-geo-place-attributes)
    "fields": [

      // bounding_box.coordinates
      { "name": "bounding_box1", "type": "float_pair", "null": true },
      { "name": "bounding_box2", "type": "float_pair", "null": true },
      { "name": "bounding_box3", "type": "float_pair", "null": true },
      { "name": "bounding_box4", "type": "float_pair", "null": true },

      // coordinates `type` should be "Polygon"
      { "name": "type", "type": "string", "shortstring": true, "null": true, "codebook": true },
      
      // country name e.g. :France"
      { "name": "country", "type": "string", "shortstring": true, "null": true, "codebook": true },
      
      // country code e.g. "FR"
      { "name": "country_code", "type": "string", "shortstring": true, "null": true, "codebook": true },

      // Full human readable place name e.g. "Paris, Paris"
      { "name": "full_name", "type": "string", "shortstring": true, "null": true },

      // ID *Note*: this **is** a string in the twitter API not an int64 like 
      // the other IDs
      { "name": "id", "type": "string", "shortstring": true, "primary": true },
      
      // Short human readable place name e.g. "Paris"
      { "name": "name", "type": "string", "shortstring": true, "null": true },

      // place_type (e.g. "city")
      { "name": "place_type", "type": "string", "shortstring": true, "null": true },

      // URL representing the location of additional place metadata for this place
      // e.g. "http://api.twitter.com/1/geo/id/7238f93a3e899af6.json"
      { "name": "url", "type": "string", "null": true }
    ], 

    "joins": [ 
      { "name": "has_tweets", "type": "index", "store": "Tweets", "inverse" : "place" }
    ],

    "keys": [ 
      { "field": "country", "type": "text" },
      { "field": "country_code", "type": "text" },
      { "field": "place_type", "type": "text" },
      { "field": "full_name", "type": "text" }
    ]
  }
]
