'use strict';

var expect = require( 'chai' ).expect;

var LambdaTester = require( 'lambda-tester' );

var mewsicLambda = require( '../handler' );

describe( 'mewsicLambda', function() {

  it( 'successful call to mewsic endpoint', function( done ) {

      LambdaTester( mewsicLambda.mewsic )
          .event( { get: 'hello world!' } )
          .expectResult()
          .verify( done );
  });

  it( 'succesfully calls /artist endpoint', function( done ) {

      let response = JSON.stringify({
        response_type: "in_channel",
        link: "Donald McKinley Glover (/ˈɡlʌvər/; born September 25, 1983) is an American actor, comedian and musician. As a recording artist, he usually performs with the stage name Childish Gambino. While a disk jockey, he performs as mcDJ. He first came to attention for his work with Derrick Comedy and with the help of Tina Fey, was hired at the age of 21 to become a writer for the NBC comedy series 30 Rock. He later played college student Troy Barnes on the NBC sitcom Community.  ... https://open.spotify.com/artist/73sIBHcqh3Z3NyqHKZ7FOL"
      })

      LambdaTester( mewsicLambda.artist )
          .event( { queryStringParameters: { text: 'childish gambino' } } )
          .expectResult( function( result ) {
            expect( result ).to.exist
            expect( result.statusCode ).to.equal(200)
            expect( result.body ).to.equal(response);
          })
          .verify( done );
  });
});
