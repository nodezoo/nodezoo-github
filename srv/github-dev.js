'use strict'

// your github token can be stored in an env variable named token,
// and will be picked up here
const TOKEN = process.env.TOKEN || 'NO_TOKEN'

require('seneca')()

  .use('redis-transport')
  .use('level-store')
  // initialise our github plugin with our token
  .use('../github.js', { token: TOKEN })

  .add('role:info,req:part', function (args, done) {
    done()

    this.act(
      'role:github,cmd:get',
      { name: args.name },

      function (err, mod) {
        if (err) return

        if (mod) {
          return this.act(
            'role:info,res:part,part:github',
            { name: args.name, data: mod.data$() })
        }

        this.act(
          'role:npm,cmd:get', { name: args.name },
          function (err, mod) {
            if (err) return

            if (mod) {
              this.act(
                'role:github,cmd:get',
                { name: args.name, giturl: mod.giturl },
                function (err, mod) {
                  if (err) return

                  if (mod) {
                    this.act('role:info,res:part,part:github',
                             { name: args.name, data: mod.data$() })
                  }
                })
            }
          })
      })
  })
  // tell our service to use seneca-mesh to find service peers and connect to
  .use('mesh', {
    auto: true,
    pins: ['role:github', 'role:info,req:part'],
    model: 'publish'
  })
  // open a seneeca repl port for debugging
  .repl(33004)
