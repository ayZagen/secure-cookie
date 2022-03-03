secure-cookie
==============

[![NPM Version][npm-badge]][npm-url]
[![Build Status][ci-badge]][ci-url]
[![Test Coverage][codecov-badge]][codecov-url]
[![Licencse][license-badge]][license-url]

Nodejs cookie library with signing and encryption support. For those familiar with
[`cookies`](https://github.com/pillarjs/cookies)
this library is almost the same plus encryption and additional configuration support.

## Installation

This library is published in the NPM registry and can be installed using any compatible package manager.

```sh
npm install secure-cookie --save

# For Yarn, use the command below.
yarn add secure-cookie
```

## Documentation

### Signed Cookies

```javascript
const {Cookies, KeyStore} = require('secure-cookie')

const app = express()
app.use(Cookies.express({
  signed: true,
  keyStore: new KeyStore({
    signing: {
  //  encoding: 'base64',
  //  algorithm: 'sha1',
      keys: ["mysigningkey"]
    }
  })
}))

//In a route handler
app.get('/some-route', function (req, res, next) {
  //This will create a cookie named MC with given value.
  // Because of signing is enabled, a new cookie with MC.sig will also be created
  // and would contain signature of the cookie.
  req.cookies.set('MC', "someValue")
})
```

### Encrypted Cookies
```javascript
const {Cookies, KeyStore} = require('secure-cookie')

const app = express()

app.use(Cookies.express({
  signed: true,
  keyStore: new KeyStore({
    encryption: {
   // algorithm: 'aes-192-ccm',
   // authTagLength: 16,
   // encoding: 'hex',
      keys: ["a24bytesecretmustchanged"]
    }
  })
}))

app.get('/set-cookie', function (req, res, next) {
  //This will create a cookie named MC with and with its encrtypted value.
  req.cookies.set('MC', "someValue")
})
app.get('/get-cookie', function (req, res, next) {
  // get decrypted value without hassle
  const myCookie = req.cookies.get('MC')
  assert.equal(myCookie, "someValue")
})
```

Make sure selected algorithm is supported by your NodeJs version.
By default `aes-192-ccm` is selected. You can override that and related settings from KeyStore constructor options.
If the algorithm you would like to use is missing from the default ones you can add it by following:

```javascript
const {KeyStore} = require('secure-cookie')
KeyStore.cipherInfo['aes-xxx-xxx'] =  { ivLength: 16, keyLength: 16 }
```

You can see included algorithms from [src/ciphers.ts](/src/ciphers.ts)

For all options and internals have a look at to [API documentation](./docs/README.md).

## License

Released under [MIT License](./LICENSE).


[npm-badge]: https://img.shields.io/npm/v/secure-cookie.svg
[npm-url]: https://www.npmjs.com/package/secure-cookie
[codecov-badge]: https://img.shields.io/codecov/c/gh/ayZagen/secure-cookie?logo=codecov
[codecov-url]: https://codecov.io/gh/ayZagen/secure-cookie
[ci-badge]: https://github.com/ayZagen/secure-cookie/workflows/ci/badge.svg
[ci-url]: https://github.com/ayZagen/secure-cookie/actions?query=workflow%3Aci
[license-badge]: https://badgen.net/github/license/ayZagen/secure-cookie
[license-url]: ./LICENSE
