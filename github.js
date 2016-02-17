'use strict'

// the github api for node
const GitHubAPI = require('github')

// eraro is a seneca module for error tracking
const Err = require('eraro')({ package: 'nodezoo-github' })

// instatiate our api with a specific version
var gitapi = new GitHubAPI({
  version: '3.0.0' // api version
})

// export our module, to be used as a seneca plugin
module.exports = function github (options) {
  var seneca = this

  // merge options with the defaults
  // token is the github api access token,
  // you can pass in your own in the plugin options.
  options = seneca.util.deepextend({
    token: ''
  }, options)

  // handle get requests, looking for info on some seneca entity
  // see: function comment
  seneca.add('role:github,cmd:get', cmd_get)

  // handle queries for some github repo, eg get it stars, num watchers, etc
  // see: function comment
  seneca.add('role:github,cmd:query', cmd_query)

  // parse some github repo url into a format usable by the query command
  // see: function comment
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

    // make a github seneca entity, which can then be acted on
    var github_ent = seneca.make$('github')

    // the name(id) of the seneca entity (for some repo)
    var github_name = args.name

    // load the entity based on the name
    github_ent.load$(github_name, function (err, github_mod) {
      if (err) return done(err)

      // if there is/was an entity stored, send it to the callback
      if (github_mod) {
        return done(null, github_mod)
      }
      // else if there is no entity stored that matches, try lookup the github
      // repo if the url is provided
      else if (args.giturl) {
        // first we should parse the github repo url
        seneca.act(
          'role:github,cmd:parse',
          { name: github_name, giturl: args.giturl },
          function (err, out) {
            if (err) return done(err)

            // now we can query the api with the info that the parse sent us.
            // to query the api, we call our query command
            seneca.act(
              'role:github,cmd:query',
              { name: github_name, user: out.user, repo: out.repo },
              done)
          })
      }
      // else, we want to do nothing as not enough info was passed to this
      // function
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

    // again, make a git seneca entity which we can act against later
    var github_ent = seneca.make$('github')

    // the name of that entity
    var github_name = args.name
    // the user who owns the github repo to be queried
    var user = args.user
    // the repo to be queried
    var repo = args.repo

    // setup the githubapi authentication with oauth
    gitapi.authenticate({
      type: 'basic',
      username: options.token, // heres where our token is useful
      password: 'x-oauth-basic'
    })

    // get some repo data from github, based on some user and their repo names
    gitapi.repos.get(
      {
        user: user, // the github user
        repo: repo // the github repo
      },
      function (err, repo) {
        if (err) return done(err)

        var data
        if (repo) {
          // build some repo data to be passed back to the querier
          data = {
            user: args.user,
            repo: args.repo,
            stars: repo.stargazers_count,
            watches: repo.subscribers_count,
            forks: repo.forks_count,
            last: repo.pushed_at
          }

          // attempt to load some entity related to the repo
          // and then save it with the updated data, or, create a new entity
          // and save it with the data
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
