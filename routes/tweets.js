var express = require('express');
var router = express.Router();
var Twit = require('twit');
var config = require('../config');

// instantiate Twit module
var twitter = new Twit(config.twitter);

var TWEET_COUNT = 5;// how many tweets to return
var MAX_WIDTH = 640;
var OEMBED_URL = 'statuses/oembed';
var USER_TIMELINE_URL = 'statuses/user_timeline';
var USER_UPDATE_URL = 'statuses/update';
var SEARCH_TWITTS_URL = 'search/tweets';
/**
 * Send tweet
 */
router.get('/update/:status',function(req,res){
  var oEmbedTweets = [];
  twitter.post(USER_UPDATE_URL, req.params, function(err, data, response) {
    getOEmbed(data);
  });
  /**
  * requests the oEmbed html
  */
  function getOEmbed (tweet) {
    // oEmbed request params
    var params = {
      "id": tweet.id_str,
      "maxwidth": MAX_WIDTH,
      "hide_thread": true,
      "hide_media": true,
      "omit_script": true,
      "align": "center"
    };

    // request data 
    twitter.get(OEMBED_URL, params, function (err, data, resp) {
      tweet.oEmbed = data;
      oEmbedTweets.push(tweet);
      res.setHeader('Content-Type', 'application/json');
      res.send(oEmbedTweets);
    });
  }
});
/**
 * GET tweets json.
 */
router.get('/search/:hashtag', function(req, res) {

  var oEmbedTweets = [], tweets = [],

  params = {
    q: req.params.hashtag,
    count: TWEET_COUNT
  };
  // if location exist
  if(req.params.geocode) {
    params.geocode = req.query.geocode;
  }
  // the max_id is passed in via a query string param
  if(req.query.max_id) {
    params.max_id = req.query.max_id;
  }

  // request data 
  twitter.get(SEARCH_TWITTS_URL, params, function (err, data, resp) {
    // get array of tweets
    tweets = data.statuses;

    var i = 0, len = tweets.length;
    for(i; i < len; i++) {
      getOEmbed(tweets[i]);
    }
  });

  /**
   * requests the oEmbed html
   */
  function getOEmbed (tweet) {
    // oEmbed request params
    var params = {
      "id": tweet.id_str,
      "maxwidth": MAX_WIDTH,
      "hide_thread": true,
      "hide_media": true,
      "omit_script": true,
      "align": "center"
    };

    // request data 
    twitter.get(OEMBED_URL, params, function (err, data, resp) {
      tweet.oEmbed = data;
      oEmbedTweets.push(tweet);

      // do we have oEmbed HTML for all Tweets?
      if (oEmbedTweets.length == tweets.length) {
        res.setHeader('Content-Type', 'application/json');
        res.send(oEmbedTweets);
      }
    });
  }
});

module.exports = router;
