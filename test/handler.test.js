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
        link: "https://open.spotify.com/artist/73sIBHcqh3Z3NyqHKZ7FOL"
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
