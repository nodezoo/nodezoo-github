/* Copyright (c) 2014-2017 Richard Rodger and other contributors, MIT License */


var Github = require('github')



module.exports = function github ( options ){
  var seneca = this

  options = seneca.util.deepextend({
    token: 'GITHUB_TOKEN'
  },options)


  var gitapi  = new Github()


  seneca.add( 'role:github,cmd:get', cmd_get )
  seneca.add( 'role:github,cmd:query', cmd_query )
  seneca.add( 'role:github,cmd:parse', cmd_parse )



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
              {name:github_name,owner:out.owner,repo:out.repo},
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
    var owner        = args.owner
    var repo        = args.repo


/*
    gitapi.authenticate({
      type:     "basic",
      username: options.token,
      password: 'x-oauth-basic'
    })
*/

    gitapi.repos.get(
      {
        owner: owner,
        repo: repo
      },
      function (err, out) {
        if( err ) return done(err);

        var repo = out.data

        var data
        if( repo ) {
          data = {
            owner:   args.owner,
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

    var m = /[\/:]([^\/:]+?)[\/:]([^\/]+?)(\.git)*$/.exec(args.giturl)
    if( m ) {
      return done( null, { owner:m[1], repo:m[2] })
    }
    else return done();
  }


}
