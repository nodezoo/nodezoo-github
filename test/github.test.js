/* Copyright (c) 2014 Richard Rodger */
"use strict";


// mocha github.test.js


var seneca  = require('seneca')

var assert  = require('assert')


function make_errhandler(fin) {
  return function(err){ err && fin(err); return true; }
}


describe('github', function() {

  var si = seneca({log:'silent',from:'./mine.options.js'})
        .use('jsonfile-store')
        .use('../github.js')

  it('parse', function( fin ) {
    si.options({errhandler:make_errhandler(fin)})

    si.act(
      'role:github,cmd:parse',
      {giturl:'git://github.com/rjrodger/norma.git'}, function(err,out){
        assert.equal('rjrodger',out.user)
        assert.equal('norma',out.repo)
        fin()
      })
  })


  it('query', function( fin ) {
    si.options({errhandler:make_errhandler(fin)})

    si.act(
      'role:github,cmd:query',
      {name:'norma',user:'rjrodger',repo:'norma'}, function(err,out){
        assert.equal(out.id,'norma')
        assert.equal(out.repo,'norma')
        assert.equal(out.user,'rjrodger')
        fin()
      })
  })


  it('get', function( fin ) {
    si.options({errhandler:make_errhandler(fin)})

    si.make$('mod').load$('gex',function(err,out){

      if( out ) {
        out.remove$(do_get)
      }
      else do_get()

      function do_get() {
        si.act(
          'role:github,cmd:get',
          {name:'gex',giturl:'https://github.com/rjrodger/gex.git'}, 
          function(err,out){
            assert.equal( out.id,   'gex')
            assert.equal( out.repo, 'gex')
            assert.equal( out.user, 'rjrodger')
            fin()
          })
      }
    })

  })


})
