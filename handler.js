'use strict';
var request = require('request');
// https://github.com/maxogden/art-of-node#callbacks

// Rollin' my own get requests, just for kicks
// https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/
// TODO: May just convery to use Request, since I need it for posting Spotify API requests anywhoo
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

// TODO still needs to be implemented on all the end points
var errorResponse = function(input) {
  let response = {
    response_type: "ephemeral",
    text: "I didn't find anything related to " + input + ". Check your spelling?"
  }
  return response // I feel like I'm writing Ruby here. May be incorrect for JS.
}

// Spotify changed their API to request hourly credentials. Adds another request in the flow.
// A lambda won't presist and know when an hour has passed, so request creds each time.
// Helpful Links:
// https://developer.spotify.com/web-api/authorization-guide/#client-credentials-flow
// https://github.com/spotify/web-api-auth-examples/tree/master/client_credentials

/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~ ///
/// START THE ACTUAL END POINTS ///
/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~ ///

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

  var artist = event.text
  console.log("Arist Endpoint " + artist)
  let SpotifyAuthOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(SpotifyAuthOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var token = body.access_token;
      var options = {
        url: 'https://api.spotify.com/v1/search?q='+ artist + '&type=artist',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        json: true
      };
      request.get(options, function(error, response, body) {
        var size = body.artists.items.length
        if (!error && response.statusCode === 200 && size > 0) {
          var artist_name = body.artists.items[0].name.replace(" ", "+")
          var link = body.artists.items[0].external_urls.spotify;
          var lastFmUrl = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist_name + '&api_key=' + process.env.LAST_FM + '&format=json'
          request.get(lastFmUrl, function(error, response, body) {
            var parsed = JSON.parse(body)
            console.log(parsed.artist)
            var bio = parsed.artist.bio.summary.split("<a");
            console.log("BIO " + bio[0] + "LINK " + link)
            let message = {
              response_type: "in_channel",
              text: bio[0] + link
            }
            console.log("sending artist callback " + message["text"])
            callback(null, message);
          })
        } else {
          let message = {
            response_type: "ephemeral",
            text: "Hmmm... are you sure you spelled " + artist + " correctly?"
          }
          console.log("Error for artist " + artist)
          callback(null, message);
        }
      })
    } else {
      let message = {
        response_type: "ephemeral",
        text: "Hmmm... seems like Spotify is down. Try again later."
      }
      console.log("Error for artist, auth token failed")
      callback(null, message);
    }
  })
};

module.exports.album = (event, context, callback) => {

  var album = event.text
  console.log("Album request for " + album)
  let SpotifyAuthOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(SpotifyAuthOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var token = body.access_token;
      var options = {
        url: 'https://api.spotify.com/v1/search?q=' + album.replace(" ", "+") + '&type=album',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        json: true
      };
      request.get(options, function(error, response, body) {
        if (body.albums.items.length > 0) {
          var albumName = body.albums.items[0].name
          var albumLink = body.albums.items[0].external_urls.spotify
          var albumArt = body.albums.items[0].images[0].url
          console.log("name " + albumName + "link " + albumLink + "art " + albumArt)
          let response = {
            response_type: "in_channel",
            text: albumLink,
            attachments: [{
              title: albumName,
              title_link: albumLink,
              image_url: albumArt
            }]
          }
          console.log("sending album callback " + response['text'])
          callback(null, response);
        } else {
          let message = {
            response_type: "ephemeral",
            text: "Hmmm... are you sure " + album + " is spelled correctly?"
          }
          console.log("Error for album " + album)
          callback(null, message);
        };
      })
    } else {
    let message = {
      response_type: "ephemeral",
      text: "Hmmm... seems like Spotify is down. Try again later."
    }
    console.log("Error for album, auth token failed")
    callback(null, message);
    }
  })
};

module.exports.song = (event, context, callback) => {

  var raw_song = event.text
  var song = raw_song.replace("by ", "")
  console.log("Song request for " + raw_song)

  let SpotifyAuthOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(SpotifyAuthOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var token = body.access_token;
      var options = {
        url: 'https://api.spotify.com/v1/search?q=' + song.replace(" ", "+") + '&type=track',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        json: true
      };
      request.get(options, function(error, response, body) {
        if (body.tracks.items.length > 0) {
          var songLink = body.tracks.items[0].external_urls.spotify
          const response = {
            response_type: "in_channel",
            text: songLink,
          }
          console.log("sending song callback " + response)
          callback(null, response);
        } else {
          let message = {
            response_type: "ephemeral",
            text: "Hmmm... are you sure there's a song called " + raw_song + "?"
          }
          console.log("Error for song " + raw_song)
          callback(null, message);
        };
      })
    } else {
    let message = {
      response_type: "ephemeral",
      text: "Hmmm... seems like Spotify is down. Try again later."
    }
    console.log("Error for song, auth token failed")
    callback(null, message);
    }
  })
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
          color: "#36a64f",
          author_name: "Genius API",
          title: song_title,
          title_link: song_url,
          image_url: song_image
        }]
      }
    console.log("sending genius callback " + response)
    callback(null, response);
    } else {
      let error_message = errorResponse(lyrics)
      callback(null, error_message)
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
