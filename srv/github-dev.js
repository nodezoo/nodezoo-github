
var HOST = process.env.HOST || 'localhost'
var REDIS = process.env.REDIS || 'localhost'
var TOKEN = process.env.TOKEN || 'NO_TOKEN'

require('seneca')()

  .use('redis-transport')
  .use('level-store')

  .use('../github.js',{token:TOKEN})

  .add('role:info,req:part',function(args,done){
    done()

    this.act(
      'role:github,cmd:get',
      {name:args.name},

      function(err,mod){
        if( err ) return;

        if( mod ) {
          return this.act(
            'role:info,res:part,part:github',
            {name:args.name,data:mod.data$()})
        }

        this.act( 
          'role:npm,cmd:get', {name:args.name},
          function(err,mod){
            if( err ) return;

            if( mod ) {
              this.act(
                'role:github,cmd:get',
                {name:args.name,giturl:mod.giturl},
                function( err, mod ){
                  if( err ) return;

                  if( mod ) {
                    this.act('role:info,res:part,part:github',
                             {name:args.name,data:mod.data$()})
                  }
                })
            }
          })
      })
  })


  .listen({ host:REDIS, type:'redis', pin:'role:info,req:part' })
  .client({ host:REDIS, type:'redis', pin:'role:info,res:part' })

  .client({ host:HOST, port:44003, pin:'role:npm' })

  .listen(44004)
  .repl(43004)
