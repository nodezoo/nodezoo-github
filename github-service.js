
var seneca = require('seneca')()
      .use('jsonfile-store')
      .use('./github.js')
      .listen()
