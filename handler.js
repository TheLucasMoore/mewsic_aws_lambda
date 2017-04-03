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
    .then((resp) => parse_info(resp))
    .catch((err) => console.error(err));

  var parse_info = function(answer) {
    var resp = JSON.parse(answer)
    var link = resp.artists.items[0].external_urls.spotify;
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        response_type: "in_channel",
        link: link
      })
    } // end response
    callback(null, response);
  }

  // var link_string = function() {
  //   var response_body = ""
  //   getContent(spotifyUrl)
  //   .then(function(answer) {
  //     var resp = JSON.parse(answer)
  //     var link = resp.artists.items[0].external_urls.spotify;
  //     response_body.push(link)
  //
  //
  //     done();
  //     // var artist_name = resp.artists.items[0].name.replace(" ", "+")
  //     // var lastFmUrl = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist_name + '&api_key=' + process.env.LAST_FM + '&format=json'
  //     //   getContent(lastFmUrl)
  //     //   .then(function(response) {
  //     //     var last_resp = JSON.parse(response)
  //     //     console.log(last_resp)
  //     //   })
  //   //     .catch((err) => console.error(err));
  //   })
  //   .catch((err) => console.error(err));
  // };

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
