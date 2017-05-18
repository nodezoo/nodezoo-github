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


  function cmd_get( msg, reply ) {
    this
      .make$('github')
      .load$( msg.name, function (err, mod) {
        if( err ) return reply(err)

        if( mod ) {
          return reply(mod)
        }

        var m = /[\/:]([^\/:]+?)[\/:]([^\/]+?)(\.git)*$/.exec(msg.giturl)
        if (!m) return reply()


        this.act(
          {
            role: 'github',
            cmd: 'query',
            name: msg.name,
            owner: m[1],
            repo: m[2]
          },
          reply)
      })
  }


  function cmd_query( msg, reply ) {
    var seneca      = this

    gitapi.repos.get(
      { owner: msg.owner, repo: msg.repo },
      function (err, out) {
        if (err) return reply(err)

        var data = {
          owner:   msg.owner,
          repo:    msg.repo,
          stars:   out.data.stargazers_count,
          watches: out.data.subscribers_count,
          forks:   out.data.forks_count,
          last:    out.data.pushed_at
        }

        seneca
          .make$('github')
          .load$(msg.name, function (err, mod) {
            if (err) return reply(err)

            if (mod) {
              return mod
                .data$(data)
                .save$(reply)
            }
            else {
              data.id$ = msg.name
              seneca
                .make$('github')
                .data$(data)
                .save$(reply)
            }
          })
      })
  }
}
