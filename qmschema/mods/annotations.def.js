// Example annotation store for tweets

[
  { // Add join to existing Tweets Store
    "name": "Tweets",
    "joins": [
      { "name": "annotations", "type": "field", "store": "Annotations", "inverse" : "tweets" }
    ]
  },

  { // ## Annotations Store
    "name": "Annotations", 
    "fields": [
      // sentiment analysis: positive, neutral, negative
      { "name": "sentiment", "type": "string", "shortstring": true, "codebook": true }
    ], 

    "joins": [ 
      { "name": "tweets", "type": "index", "store": "Tweets", "inverse" : "annotations" }
    ],

    "keys": [
      { "field": "sentiment", "type": "value" }
    ]
  }
]
