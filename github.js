/* Copyright (c) 2014 Richard Rodger, MIT License */
/* jshint node:true, asi:true, eqnull:true */
"use strict";


var GitHubAPI = require('github')

var gitapi  = new GitHubAPI({
  version: "3.0.0"
})



module.exports = function github( options ){
  var seneca = this


  seneca.add(
    'role:github,cmd:get', 
    {
      name:   { required$:true, string$:true },
      giturl: { string$:true }
    }, 
    cmd_get)


  seneca.add(
    'role:github,cmd:query', 
    { 
      name: { required$:true, string$:true },
      user: { required$:true, string$:true },
      repo: { required$:true, string$:true },
    },
    cmd_query)


  seneca.add(
    'role:github,cmd:parse', 
    {
      giturl: { required$:true, string$:true },
    },
    cmd_parse)



  function cmd_get( args, done ) {
    var seneca  = this
    var mod_ent = seneca.make$('mod')

    var mod_name = args.name

    mod_ent.load$( mod_name, function(err,mod){
      if( err ) return done(err);

      if( mod ) {
        return done(null,mod);
      }
      else if( args.giturl ) {
        seneca.act(
          'role:github,cmd:parse',
          {name:mod_name,giturl:args.giturl},

          function(err,out){
            if( err ) return done(err);

            seneca.act(
              'role:github,cmd:query',
              {name:mod_name,user:out.user,repo:out.repo},
              done)
          })
      }
      else return done();
    })
  }


  function cmd_query( args, done ) {
    var seneca  = this
    var mod_ent = seneca.make$('mod')

    var mod_name = args.name
    var user     = args.user
    var repo     = args.repo

    gitapi.authenticate({
      type:     "basic",
      username: options.token,
      password: 'x-oauth-basic'
    })

    gitapi.repos.get(
      {
        user: user,
        repo: repo
      },
      function(err,repo){
        if( err ) return done(err);

        var data
        if( repo ) {
          data = {
            user:    args.user,
            repo:    args.repo,
            stars:   repo.stargazers_count,
            watches: repo.subscribers_count,
            forks:   repo.forks_count,
            last:    repo.pushed_at
          }

          mod_ent.load$(mod_name, function(err,mod){
            if( err ) return done(err);

            if( mod ) {
              return mod.data$(data).save$(done);
            }
            else {
              data.id$ = mod_name
              mod_ent.make$(data).save$(done);
            } 
          })
        }
        else return done()

      }
    )
  }


  function cmd_parse( args, done ) {
    var seneca  = this

    var m = /[\/:]([^\/]+?)\/([^\/]+?)(\.git)*$/.exec(args.giturl)
    if( m ) {
      return done( null, { user:m[1], repo:m[2] })
    }
    else return done();
  }
  
  
}
