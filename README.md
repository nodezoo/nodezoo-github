![Nodezoo](https://raw.githubusercontent.com/nodezoo/nodezoo-org/master/assets/logo-nodezoo.png)

## nodezoo-github

- __Lead:__ [Richard Rodger][Lead]
- __Sponsor:__ [nearForm][]

Nodezoo.com micro-service handling github meta data. Please see the [main repo][] for more details

If you're using this microservice, and need help, you can:

- Post a [github issue][],
- Tweet to [@nodezoo][],
- Ask on the [Gitter][gitter-url].

## Running
This micro-service can be ran as part of the [NodeZoo org][] system. Please follow the
link below for details on obtaining and running the complete system.

- [Nodezoo: The complete system][System]

## Creating a GitHub Personal Access Token

  - In the top right corner of any page, click your profile photo, then click Settings.
  - In the user settings sidebar, click Personal access tokens.
  - Click Generate new token
  - Give your token a descriptive name.
  - Select the scopes you wish to grant to this token. The default scopes allow you to interact with public and private repositories, user data, and gists
  - Click Generate token.
  - Copy the token to your clipboard. For security reasons, after you navigate off this page, no one will be able to see the token again.

## Patterns Handled
### `role:github,cmd:get`
Request module details by name
```js
seneca.act('role:github, cmd:get', {name: 'seneca'})
```

## Patterns Emitted

There are no outgoing messages.

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
[System]: https://github.com/nodezoo/nodezoo-system
