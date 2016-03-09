'use strict'

// your github token can be stored in an env variable named token,
// and will be picked up here

var TOKEN = process.env.TOKEN || 'd520a5c9b6bd17e6b16ac72493b34a8c0402863f'

require('seneca')()
  .use('../github.js', {token: TOKEN})
  .add('role:info,req:part', function (args, done) {
    done()

    this.act('role:github,cmd:get', {name: args.name}, function (err, mod) {
      if (err) {
        this.log.error(err)
        return
      }

      if (mod) {
        return this.act('role:info,res:part,part:github', {name: args.name, data: mod.data$()})
      }

      this.act('role:npm, cmd:get', {name: args.name}, function (err, mod) {
        if (err) {
          this.log.error(err)
          return
        }
        if (mod) {
          this.act('role:github,cmd:get', {name: args.name, giturl: mod.giturl}, function (err, mod) {
            if (err) {
              this.log.error(err)
              return
            }

            if (mod) {
              this.act('role:info,res:part,part:github', {name: args.name, data: mod.data$()})
            }
          })
        }
      })
    })
  })
  .use('mesh', {
    auto: true,
    pin: ['role:github', 'role:info,req:part'],
    model: 'publish'
  })
  .repl(33004)
