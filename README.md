# [secure-cookie]

<a href="https://github.com/ayZagen/secure-cookie/actions?query=workflow%3Aci">
<img src="https://github.com/ayZagen/secure-cookie/workflows/ci/badge.svg" alt="Build Status">
</a>
<a href="https://codecov.io/gh/PlusAuth/plusauth-oidc-client-js">
<img alt="Codecov" src="https://img.shields.io/codecov/c/gh/ayZagen/secure-cookie?logo=codecov&style=flat-square">
</a>
<a href="./LICENSE">
<img alt="License" src="https://badgen.net/github/license/ayZagen/secure-cookie">
</a>


Nodejs cookie library with signing and encryption support. Inspired from [`cookies`](https://github.com/pillarjs/cookies) and  [`crypto-utils/keygrip`](https://github.com/crypto-utils/keygrip)

## Installation

This library is published in the NPM registry and can be installed using any compatible package manager.

```sh
npm install secure-cookie --save

# For Yarn, use the command below.
yarn add secure-cookie
```

## Documentation

Express usage
```javascript
const express = require('express')
const { Cookies, KeyStore } = require('secure-cookies')

const app = express()

app.use(Cookies.express())

//In a route handler
app.get('/some-route', function (req, res, next) {
    req.cookies.get('some-cookie')
})
```

[Documentation generated from source files by Typedoc](./docs/README.md).

## License

Released under [MIT License](./LICENSE).
