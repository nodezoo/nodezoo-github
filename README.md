![Nodezoo](https://github.com/nodezoo/nodezoo-org/blob/master/assets/logo-nodezoo.png)

## nodezoo-github

- __Lead:__ [Richard Rodger][Lead]
- __Sponsor:__ [nearForm][]

Nodezoo.com micro-service handling github meta data. Please see the [main repo][] for more details

If you're using this microservice, and need help, you can:

- Post a [github issue][],
- Tweet to [@nodezoo][],
- Ask on the [Gitter][gitter-url].

## Install
1. clone this repo into a root _/nodezoo_ folder.
2. run `npm install`

## Starting

```sh
$ node srvs/github-dev.js --seneca.options.github.token=GITHUB-PERSONAL-ACCESS-TOKEN --seneca.log.all
```
## Creating a GitHub Personal Access Token

  - In the top right corner of any page, click your profile photo, then click Settings.
  - In the user settings sidebar, click Personal access tokens.
  - Click Generate new token
  - Give your token a descriptive name.
  - Select the scopes you wish to grant to this token. The default scopes allow you to interact with public and private repositories, user data, and gists
  - Click Generate token.
  - Copy the token to your clipboard. For security reasons, after you navigate off this page, no one will be able to see the token again.

## Messages

This micro-service recognizes the following messages:

  * _role:github,cmd:get_
  * _role:github,cmd:query_
  * _role:github,cmd:parse_
  * _role:github,cmd:extract_

## Running with Curl

Any of the messages above can be run using curl in the following format in the command line
```
curl -d '{"role":"github","cmd":"get"}' http://localhost:52472/act
```

## Contributing
The [NodeZoo org][] encourages __open__ and __safe__ participation.

- __[Code of Conduct]__

If you feel you can help in any way, be it with documentation, examples, extra testing, or new
features please get in touch.

## License
Copyright (c) 2014-2016, Richard Rodger and other contributors.
Licensed under [MIT][].

[main repo]: https://github.com/rjrodger/nodezoo
[MIT]: ./LICENSE
[Code of Conduct]: https://github.com/nodezoo/nodezoo-org/blob/master/CoC.md
[nearForm]: http://www.nearform.com/
[NodeZoo org]: http://www.nodezoo.com/
[Lead]: https://github.com/rjrodger
[github issue]: https://github.com/nodezoo/nodezoo-github/issues
[@nodezoo]: http://twitter.com/nodezoo
[gitter-url]: https://gitter.im/nodezoo/nodezoo-org
