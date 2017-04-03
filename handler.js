'use strict';
// https://github.com/maxogden/art-of-node#callbacks

// WHO NEEDS DEPENDENCIES?!
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
  var artist = event.queryStringParameters.text.replace(" ", "+")
  var spotifyUrl = "https://api.spotify.com/v1/search?q=" + artist + "&type=artist"
  console.log("artist end point begun for " + artist)

  getContent(spotifyUrl)
    .then((content) => next_request(content))
    .catch((err) => console.error(err));

  var next_request = function(content) {
    var parsed = JSON.parse(content)
    var link = parsed.artists.items[0].external_urls.spotify;
    console.log(link)
    // to ensure last fm bio matches, pull it from Spotify request
    var artist_name = parsed.artists.items[0].name.replace(" ", "+")
    var lastFmUrl = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist_name + '&api_key=' + process.env.LAST_FM + '&format=json'
      getContent(lastFmUrl)
      .then(function(last_fm_response) {
        var last_resp = JSON.parse(last_fm_response)
        var bio = last_resp.artist.bio.summary.split("<a");
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            response_type: "in_channel",
            link: bio[0] + " ... " + link
          })
        } // end response
        callback(null, response);
      })
      .catch((err) => console.error(err));
  }
};

module.exports.album = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Album Endpoint',
      input: event,
    }),
  };
  callback(null, response);
};

module.exports.genius = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Genius Endpoint',
      input: event,
    }),
  };
  callback(null, response);
};

module.exports.concert = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Concert Endpoint',
      input: event,
    }),
  };
  callback(null, response);
};
