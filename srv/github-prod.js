/* Copyright (c) 2014-2017 Richard Rodger and other contributors, MIT License */

//var BASES = process.env.BASES.split(',')
var CONSUL = process.env.CONSUL_SERVICE_HOST || 'localhost'


var Seneca = require('seneca')

Seneca({tag: 'github'})
  .use('entity')

  .use('consul-registry', {
    host: CONSUL
  })

  .use('jsonfile-store', {folder: __dirname+'/../data'})

  .use('../github.js')

  .add('role:info,need:part', function (msg, reply) {
    reply()

    this.act(
      'role:github,cmd:get', {name:msg.name},
      function (err, mod) {
        if (err) return

        if (mod) {
          return this.act('role:info,collect:part,part:github',
                          {name:msg.name,data:this.util.clean(mod.data$())})
        }

        this.act(
          'role:npm,cmd:get', {name:msg.name},
          function (err, mod) {
            if (err) return

            if (mod) {
              this.act(
                'role:github,cmd:get', {name:msg.name, giturl:mod.giturl},
                function( err, mod ){
                  if( err ) return

                  if( mod ) {
                    this.act('role:info,collect:part,part:github',
                             {name:msg.name,data:this.util.clean(mod.data$())})
                  }
                })
            }
          })
      })
  })

  .use('mesh', {
    listen: [
      {pin: 'role:github'},
      {pin: 'role:info,need:part', model:'observe'}
    ],
    //bases: BASES,
    host: '@eth0',
    discover: {
      registry: {
        active: true
      }
    }
  })
