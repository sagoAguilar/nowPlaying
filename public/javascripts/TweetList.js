var app = angular.module('Twitter', ['ngResource', 'ngSanitize','infinite-scroll']);

app.controller('TweetList', function($scope, $resource, $timeout) {
    /**
     * init controller and set defaults
     */
    function init () {
      // set a default username value
      $scope.username = "BInowplaying";
      $scope.location="";
      $scope.hashtag = "nowplaying";

      // empty tweet model
      $scope.tweetsResult = [];

      // initiate masonry.js
      $scope.msnry = new Masonry('#tweet-list', {
        columnWidth: 500,
        itemSelector: '.tweet-item',
        transitionDuration: 0,
        isFitWidth: true
      });
      // layout masonry.js on widgets.js loaded event
      twttr.events.bind('loaded', function () {
        $scope.msnry.reloadItems();
        $scope.msnry.layout();
      });
      // get getLocation
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(function(position){
          $scope.geolocation = position;
          initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
          geocoder = new google.maps.Geocoder();
          geocoder.geocode({'latLng': initialLocation}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              if (results[1]) {
                // update location from
                var length = results[1].address_components.length;
                $scope.Location="near "+results[1].address_components[length-2].long_name+', '+results[1].address_components[length-1].long_name;
              } else {
                console.log('No results found');
                $scope.Location='Around the World!!!';
              }
              // Call initial tweets
              $scope.getTweets();
            } else {
              console.log('Geocoder failed due to: ' + status);
              // Call initial tweets
              $scope.Location='Around the World!!!';
              $scope.getTweets();
            }
          });
        });
      }else{
        // Call initial tweets
        $scope.Location='Around the World!!!';
        $scope.getTweets();
      }
      // Kick off the interval
      $scope.intervalFunction();
    }

    /**
     * Search and processes tweet data
     */
    function getTweets (paging) {
      var params = {
        action: 'search',
        hashtag: encodeURI('#'+$scope.hashtag+" youtube filter:links")
      };
      // if location exist
      if($scope.geolocation){
        params.geocode=encodeURI($scope.geolocation.coords.latitude+','+$scope.geolocation.coords.longitude+',1mi');
      }
      if ($scope.maxId) {
        params.max_id = $scope.maxId;
      }
      // create Tweet data resource
      $scope.tweets = $resource('/tweets/:action/:hashtag', params);

      // GET request using the resource
      $scope.tweets.query( { }, function (res) {

        if( angular.isUndefined(paging) ) {
          $scope.tweetsResult = [];
        }

        $scope.tweetsResult = $scope.tweetsResult.concat(res);

        // for paging - https://dev.twitter.com/docs/working-with-timelines
        $scope.maxId = res[res.length - 1].id;

        // render tweets with widgets.js
        $timeout(function () {
          twttr.widgets.load();
        }, 30);
      });
    }
    /**
    * Sending new Tweet
    */
    function setTweet(){
      // will need to see if the status is adding
      if(!$scope.youtubeUrl || !$scope.tweetMsg){return false;}
      var status = $scope.tweetMsg;
      if(!status.match(/#([^\s]+)/) || status.match(/#([^\s]+)/).filter(function(el){return el.toLowerCase()=="#nowplaying";}).length<0){ status+=' #nowplaying';}
      var params = {
        action: 'update',
        status: $scope.youtubeUrl+' '+status
      };
      if($scope.geolocation){
        params.lat = $scope.geolocation.coords.latitude;
        params.long = $scope.geolocation.coords.longitude;
      }
      console.log(params);
      $scope.tweeted= $resource('/tweets/:action/:status', params);

      $scope.tweeted.query( { }, function (res) {
        $scope.tweetsResult = res.concat($scope.tweetsResult);
        // render tweets with widgets.js
        $timeout(function () {
          twttr.widgets.load();
        }, 30);
      });
    }
    /**
     * binded to @user input form
     */
    $scope.getTweets = function () {
      $scope.maxId = undefined;
      getTweets();
    };
    $scope.setTweet = function () {
      setTweet();
    };
    /**
     * binded to 'Get More Tweets' button
     * add this to scroll event
     */
    $scope.getMoreTweets = function () {
      getTweets(true);
    };
    // Function to replicate setInterval using $timeout service.
    $scope.intervalFunction = function(){
      $timeout(function() {
        $scope.getTweets();
        $scope.intervalFunction();
      }, 60000);
    };
    init();
});