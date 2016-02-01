'use strict'

const GitHubAPI = require('github')
const Err = require('eraro')({ package: 'nodezoo-github' })

var gitapi = new GitHubAPI({
  version: '3.0.0'
})

module.exports = function github (options) {
  var seneca = this

  options = seneca.util.deepextend({
    token: ''
  }, options)

  seneca.add('role:github,cmd:get', cmd_get)
  seneca.add('role:github,cmd:query', cmd_query)
  seneca.add('role:github,cmd:parse', cmd_parse)

  /*
   * function cmd_get(args, done)
   * Param: args. The args received by the seneeca act
   * Param: done. The callback
   *
   * Tries to get data on a github repo from a seneca entity in some connected store.
   * If none is found, this founction tries to fallback to a giturl argument
   * to fetch the data from github.
   *
   * Expected input: args.name. The id of the seneca entity to be found/created.
   * Expected input: args.giturl. the repo location, used if no entity is found.
   * Callback returns (error, output).
   * Output is a dynamic object which contains data on a github repo.
   */
  function cmd_get (args, done) {
    var seneca = this
    var github_ent = seneca.make$('github')

    var github_name = args.name

    github_ent.load$(github_name, function (err, github_mod) {
      if (err) return done(err)

      if (github_mod) {
        return done(null, github_mod)
      }
      else if (args.giturl) {
        seneca.act(
          'role:github,cmd:parse',
          { name: github_name, giturl: args.giturl },
          function (err, out) {
            if (err) return done(err)

            seneca.act(
              'role:github,cmd:query',
              { name: github_name, user: out.user, repo: out.repo },
              done)
          })
      }
      else return done()
    })
  }

  /*
   * function cmd_query(args, done)
   * Param: args. The args received by the seneeca act
   * Param: done. The callback
   *
   * Gets data on some github repo given the owner and repo name
   *
   * Expected input: args.name. The id of the seneca entity to be created.
   * Expected input: args.user. The user who owns some github repo.
   * Expected input: args.repo. the repo they own.
   * Callback returns (error, output).
   * Output is a dynamic object which contains data on a github repo.
   */
  function cmd_query (args, done) {
    var seneca = this
    var github_ent = seneca.make$('github')

    var github_name = args.name
    var user = args.user
    var repo = args.repo

    gitapi.authenticate({
      type: 'basic',
      username: options.token,
      password: 'x-oauth-basic'
    })

    gitapi.repos.get(
      {
        user: user,
        repo: repo
      },
      function (err, repo) {
        if (err) return done(err)

        var data
        if (repo) {
          data = {
            user: args.user,
            repo: args.repo,
            stars: repo.stargazers_count,
            watches: repo.subscribers_count,
            forks: repo.forks_count,
            last: repo.pushed_at
          }

          github_ent.load$(github_name, function (err, github_mod) {
            if (err) return done(err)

            if (github_mod) {
              return github_mod.data$(data).save$(done)
            }
            else {
              data.id$ = github_name
              github_ent.make$(data).save$(done)
            }
          })
        }
        else return done()
      }
    )
  }

  /*
   * function cmd_parse(args, done)
   * Param: args. The args received by the seneeca act
   * Param: done. The callback
   *
   * Parses a github repo url to its owner and repo name
   *
   * Expected input: args.giturl. The url of a git repo.
   * Callback returns (error, output).
   * Output is a dynamic object which contains a `user` and `repo` property
   * on a valid `args.giturl`, or it contains an `ok: false` property.
   */
  function cmd_parse (args, done) {
    // The regex below tries to parse the owner and repo name from a valid
    // github url, in the formats:
    // git@github.com:owner/repo
    // git@github.com:owner/repo.git
    // https://github.com/owner/repo.git
    // Etc...
    var match = /[\/:]([^\/:]+?)[\/:]([^\/]+?)(\.git)*$/.exec(args.giturl)
    if (match) {
      return done(null, { user: match[1], repo: match[2] })
    }
    else return done(null, { ok: false, err: Err('parsing input failed') })
  }
}
