'use strict';
var request = require('request');
// https://github.com/maxogden/art-of-node#callbacks

// Rollin' my own get requests, just for kicks
// https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/
const getContent = function(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.on('error', (err) => reject(err))
  })
};

// JavaScript. 'Tis a silly language.
var capitalize = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// still needs to be implemented on all the end points
const errorResponse = function(input) {
  let response = {
    response_type: "ephemeral",
    text: "I didn't find anything related to " + input + ". Check your spelling?"
  }
  callback(null, response);
}

// SPOTIFY changed their API to request hourly credentials

var SpotifyAuthOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(proces.env.SPOTIFY_CLIENT_ID + ':' + proces.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

var currentSpotifyToken = "" // global variable should dynamically update if we get a 401

request.post(SpotifyAuthOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) {
    currentSpotifyToken = body.access_token;
  }
});

/// START THE ACTUAL END POINTS ///

module.exports.mewsic = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hey, it me. Dis works.',
      input: event,
    }),
  };
  callback(null, response);
};

module.exports.artist = (event, context, callback) => {
  // http://www.ryanray.me/serverless-slack-integrations
  // format conversion of urlencoded -> JSON at API Gateway
  console.log("EVENT TEXT " + event.text)
  var artist = event.text.replace(" ", "+")
  var spotify_url = "https://api.spotify.com/v1/search?q=" + artist + "&type=artist"
  console.log("artist end point begun for " + artist)

  getContent(spotify_url)
    .then((content) => next_request(content))
    .catch((err) => console.error(err));

  var next_request = function(content) {
    var parsed = JSON.parse(content)
    var link = parsed.artists.items[0].external_urls.spotify;
    // to ensure last fm bio matches, pull it from Spotify request
    var artist_name = parsed.artists.items[0].name.replace(" ", "+")
    var lastFmUrl = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist_name + '&api_key=' + process.env.LAST_FM + '&format=json'
      getContent(lastFmUrl)
      .then(function(last_fm_response) {
        var last_resp = JSON.parse(last_fm_response)
        var bio = last_resp.artist.bio.summary.split("<a");
        const response = {
          response_type: "in_channel",
          text: bio[0] + " " + link
        }
        console.log("sending artist callback " + response)
        callback(null, response);
      })
      .catch((err) => console.error(err));
      // add an error response?
  }
};

module.exports.album = (event, context, callback) => {
  var album = event.text
  console.log("Album request began for " + album)
  var artistUrl = 'https://api.spotify.com/v1/search?q=' + album.replace(" ", "+") + '&type=album'

  getContent(artistUrl)
    .then((content) => parse_response(content))
    .catch((err) => console.error(err));

  var parse_response = function(content) {
    var parsed = JSON.parse(content)
    if (parsed.albums.items.length > 0) {
      var albumName = parsed.albums.items[0].name
      var albumLink = parsed.albums.items[0].external_urls.spotify
      var albumArt = parsed.albums.items[0].images[0].url
      const response = {
        response_type: "in_channel",
        text: albumLink,
        attachments: [{
          title: albumName,
          image_url: albumArt
        }]
      }
      console.log("sending album callback " + response)
      callback(null, response);
    }
  }
};

module.exports.song = (event, context, callback) => {
  console.log("Song Endpoint Started")
  var raw_song = event.text
  var song = raw_song.replace("by ", "")
  console.log("Song request began for " + song)
  var artistUrl = 'https://api.spotify.com/v1/search?q=' + song.replace(" ", "+") + '&type=track'

  getContent(artistUrl)
    .then((content) => parse_response(content))
    .catch((err) => errorResponse(err));

  var parse_response = function(content) {
    var parsed = JSON.parse(content)
    if (parsed.tracks.items.length > 0) {
      var songLink = parsed.tracks.items[0].external_urls.spotify
      const response = {
        response_type: "in_channel",
        text: songLink,
      }
      console.log("sending song callback " + response)
      callback(null, response);
    } else {
      var nothing_found = errorResponse(event.text)
      callback(null, nothing_found);
    }
  }
};

module.exports.genius = (event, context, callback) => {
  var lyrics = event.text
  console.log("genius request begun for " + lyrics)
  var genius_url = "https://api.genius.com/search?access_token=" + process.env.GENIUS_ACCESS + "&q=" + lyrics

  getContent(genius_url)
    .then((content) => parse_response(content))
    .catch((err) => console.error(err));

  var parse_response = function(content) {
    var parsed = JSON.parse(content)
    if (parsed.response.hits.length > 0) {
      var song_url = parsed.response.hits[0].result.url;
      var song_title = parsed.response.hits[0].result.full_title
      var song_image = parsed.response.hits[0].result.header_image_thumbnail_url;
      const response = {
        response_type: "in_channel",
        attachments: [{
          title: song_title,
          title_link: song_url,
          image_url: song_image
        }]
      }
    console.log("sending genius callback " + response)
    callback(null, response);
    }
  }
};

module.exports.concert = (event, context, callback) => {
  var text = event.text.split(", ")
  var location = text[0];
  var artist = text[1];
  var concertArtist = artist.replace(" ", "+")
  var locationUrl = 'https://api.songkick.com/api/3.0/search/locations.json?query=' + location + '&apikey=' + process.env.SONGKICK_API

  getContent(locationUrl)
    .then((content) => next_request(content))
    .catch((err) => console.error(err));

  var next_request = function(content) {
    var parsed = JSON.parse(content)
    var locationId = parsed.resultsPage.results.location[0].metroArea.id
    var url = 'https://api.songkick.com/api/3.0/events.json?apikey=' + process.env.SONGKICK_API + '&artist_name=' + concertArtist + '&location=sk:' + locationId
    getContent(url)
    .then(function(concert_response) {
      var last_resp = JSON.parse(concert_response)
      var results = last_resp.resultsPage.results;
      var size = last_resp.resultsPage.totalEntries;

      if (size !== 0) {
        var eventType = results.event[0].type.toLowerCase()
        var displayName = results.event[0].displayName
        var uri = results.event[0].uri
        const response = {
          response_type: "in_channel",
          text: "I found a " + eventType,
          attachments: [{
            title: displayName,
            title_link: uri
          }]
        }
        console.log("sending artist callback " + response)
        callback(null, response);
      } else {
        const response = {
          response_type: "in_channel",
          text: "It doesn't seem like " + capitalize(artist) + " will be in " + capitalize(location) + " anytime soon."
        }
        console.log("sending failed artist callback " + response)
        callback(null, response);
      } // end if
    }) // then
    .catch((err) => console.error(err));
  }
}
