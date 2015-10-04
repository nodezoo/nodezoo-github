/* Copyright (c) 2014 Richard Rodger, MIT License */
/* jshint node:true, asi:true, eqnull:true */
"use strict";


var GitHubAPI = require('github')

var gitapi  = new GitHubAPI({
  version: "3.0.0"
})



module.exports = function github( options ){
  var seneca = this

  console.log(options)

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
    var seneca      = this
    var github_ent  = seneca.make$('github')

    var github_name = args.name

    github_ent.load$( github_name, function(err,github_mod){
      if( err ) return done(err);

      if( github_mod ) {
        return done(null,github_mod);
      }
      else if( args.giturl ) {
        seneca.act(
          'role:github,cmd:parse',
          {name:github_name,giturl:args.giturl},

          function(err,out){
            if( err ) return done(err);

            seneca.act(
              'role:github,cmd:query',
              {name:github_name,user:out.user,repo:out.repo},
              done)
          })
      }
      else return done();
    })
  }


  function cmd_query( args, done ) {
    var seneca      = this
    var github_ent  = seneca.make$('github')

    var github_name = args.name
    var user        = args.user
    var repo        = args.repo

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

          github_ent.load$(github_name, function(err,github_mod){
            if( err ) return done(err);

            if( github_mod ) {
              return github_mod.data$(data).save$(done);
            }
            else {
              data.id$ = github_name
              github_ent.make$(data).save$(done);
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
