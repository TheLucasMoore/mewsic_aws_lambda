'use strict';

var expect = require( 'chai' ).expect;
var config = require('../config.json');
var LambdaTester = require( 'lambda-tester' );
var mewsicLambda = require( '../handler' );
var sinon = require('sinon') // TO DO

describe( 'mewsicLambda', function() {

  it( 'successful call to mewsic endpoint', function( done ) {

      LambdaTester( mewsicLambda.mewsic )
          .event( { get: 'hello world!' } )
          .expectResult()
          .verify( done );
  });

  it( 'succesfully calls /artist endpoint', function( done ) {

      let response = {
        response_type: "in_channel",
        text: "Donald McKinley Glover (/ˈɡlʌvər/; born September 25, 1983) is an American actor, comedian and musician. As a recording artist, he usually performs with the stage name Childish Gambino. While a disk jockey, he performs as mcDJ. He first came to attention for his work with Derrick Comedy and with the help of Tina Fey, was hired at the age of 21 to become a writer for the NBC comedy series 30 Rock. He later played college student Troy Barnes on the NBC sitcom Community.  ... https://open.spotify.com/artist/73sIBHcqh3Z3NyqHKZ7FOL"
      }

      LambdaTester( mewsicLambda.artist )
          .event( { queryStringParameters: { text: 'childish gambino' } } )
          .expectResult( function( result ) {
            expect( result ).to.exist
            expect( result.statusCode ).to.equal(200)
            expect( result.body ).to.equal(response);
          })
          .verify( done );
  });

    it( 'succesfully calls /album endpoint', function( done ) {

        let response = {
          "response_type": "in_channel",
          "text": "https://open.spotify.com/album/7LWTCCUFJ0USkRscNJJrI5",
          "attachments": [{
            "title": "Hella Personal Film Festival",
            "image_url": "https://i.scdn.co/image/5ba38a31cba7dad300b8e0faa9855831e56d5aa8"
          }]
        }

        LambdaTester( mewsicLambda.album )
            .event( { queryStringParameters: { text: 'hella personal film festival' } } )
            .expectResult( function( result ) {
              expect( result ).to.exist
              expect( result.statusCode ).to.equal(200)
              expect( result.body ).to.equal(response);
            })
            .verify( done );
    });

    it( 'succesfully calls /song endpoint', function( done ) {

        let response = {
          "response_type": "in_channel",
          "text": "https://open.spotify.com/track/0y60itmpH0aPKsFiGxmtnh",
        }

        LambdaTester( mewsicLambda.song )
            .event( { queryStringParameters: { text: 'wait a minute willow smith' } } )
            .expectResult( function( result ) {
              expect( result ).to.exist
              expect( result.statusCode ).to.equal(200)
              expect( result.body ).to.equal(response);
            })
            .verify( done );
    });

    it( 'succesfully calls /genius endpoint', function( done ) {

        let response = {
          "response_type": "in_channel",
          "attachments": [{
            "title": "Meat Grinder by Madvillain",
            "title_link": "https://genius.com/Madvillain-meat-grinder-lyrics",
            "image_url": "https://s3.amazonaws.com/rapgenius/1365961445_Madvillainy.png"
          }]
        }

        LambdaTester( mewsicLambda.genius )
            .event( { queryStringParameters: { text: 'meat grinder' } } )
            .expectResult( function( result ) {
              expect( result ).to.exist
              expect( result.statusCode ).to.equal(200)
              expect( result.body ).to.equal(response);
            })
            .verify( done );
    });

    it( 'succesfully calls /concert endpoint', function( done ) {

        let response = {
          response_type: "in_channel",
          text: "I found a concert",
          attachments: [{
            title: "Vulfpeck at Ogden Theatre (May 30, 2017)",
            title_link: "http://www.songkick.com/concerts/28748319-vulfpeck-at-ogden-theatre?utm_source=41656&utm_medium=partner"
          }]
        }

        LambdaTester( mewsicLambda.concert )
            .event( { queryStringParameters: { text: 'denver, vulfpeck' } } )
            .expectResult( function( result ) {
              expect( result ).to.exist
              expect( result.statusCode ).to.equal(200)
              expect( result.body ).to.equal(response);
            })
            .verify( done );
    });

    it( 'handles no concert gracefully', function( done ) {

        let response = {
          response_type: "in_channel",
          text: "It doesn't seem like Queen will be in London anytime soon."
        }

        LambdaTester( mewsicLambda.concert )
            .event( { queryStringParameters: { text: 'london, queen' } } )
            .expectResult( function( result ) {
              expect( result ).to.exist
              expect( result.statusCode ).to.equal(200)
              expect( result.body ).to.equal(response);
            })
            .verify( done );
    });
  });
