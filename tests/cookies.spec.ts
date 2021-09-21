/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "assert";
import {Cookies, CookiesOptions, KeyStore, SetCookieOptions} from "../src";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import request from "supertest";
import DoneCallback = jest.DoneCallback;

describe('new Cookies(req, res, [options])', function () {
  it('should create new cookies instance', function (done) {
    assertServer(done, function (req: any, res: any) {
      const cookies = new Cookies(req, res)
      assert.ok(cookies)
      assert.strictEqual(cookies.constructor, Cookies)
      assert.strictEqual(cookies.request, req)
      assert.strictEqual(cookies.response, res)
      expect(cookies.keyStore).toBeInstanceOf(KeyStore)
    })
  })

  describe('options', function () {

    it('should accept KeyStore instance', function (done) {
      assertServer(done, function (req: any, res: any) {
        const keyStore = new KeyStore({signing: {keys: ['keyboard cat'], algorithm: 'sha1'}})
        const cookies = new Cookies(req, res, {keyStore})
        expect(cookies.keyStore).toBeInstanceOf(KeyStore)
        assert.strictEqual(cookies.keyStore.sign('foo=bar'), 'iW2fuCIzk9Cg_rqLT1CAqrtdWs8')
      })
    })

    describe('.secure', function () {
      it('should default to undefined', function (done) {
        assertServer(done, function (req: any, res: any) {
          const cookies = new Cookies(req, res)
          assert.strictEqual(cookies.secure, undefined)
        })
      })

      it('should set secure flag', function (done) {
        assertServer(done, function (req: any, res: any) {
          const cookies = new Cookies(req, res, {secure: true})
          assert.strictEqual(cookies.secure, true)
        })
      })
      it('should set signed flag', function (done) {
        assertServer(done, function (req: any, res: any) {
          const cookies = new Cookies(req, res, {signed: true})
          assert.strictEqual(cookies.signed, true)
        })
      })
      it('should set encrypted flag', function (done) {
        assertServer(done, function (req: any, res: any) {
          const cookies = new Cookies(req, res, {encrypted: true})
          assert.strictEqual(cookies.encrypted, true)
        })
      })
    })
  })

  describe('.get(name, [options])', function () {
    it('should return value of cookie', function (done) {
      request(createServer(getCookieHandler('foo')))
        .get('/')
        .set('Cookie', 'foo=bar')
        .expect(200, 'bar', done)
    })

    it('should work for cookie name with special characters', function (done) {
      request(createServer(getCookieHandler('foo*(#bar)?.|$')))
        .get('/')
        .set('Cookie', 'foo*(#bar)?.|$=buzz')
        .expect(200, 'buzz', done)
    })

    it('should return undefined without cookie', function (done) {
      request(createServer(getCookieHandler('fizz')))
        .get('/')
        .set('Cookie', 'foo=bar')
        .expect(200, 'undefined', done)
    })

    it('should return undefined without header', function (done) {
      request(createServer(getCookieHandler('foo')))
        .get('/')
        .expect(200, 'undefined', done)
    })

    describe('"encrypted" option', function () {
      describe('when true', function () {
        it('should throw without .keys', function (done) {
          request(createServer(getCookieHandler('foo', {encrypted: true})))
            .get('/')
            .set('Cookie', 'foo=doesnotmatter')
            .expect(500)
            .expect('Error: keys required for encrypted cookies')
            .end(done)
        })

        it('should return decrypted cookie value', function (done) {
          const opts = {
            keyStore: new KeyStore({
              encryption: {
                keys: ['secretsecretsecretsecret'],
                encoding: "base64"
              }
            })
          }
          request(createServer(opts, getCookieHandler('foo', {encrypted: true})))
            .get('/')
            .set('Cookie', 'foo=xOxYwbV72DCmmzMaSe1XuTDG79GqxDPRaBjXh8bF5jDvoVoF')
            .expect(200, 'ohmytext', done)
        })

        it('should return null when decryption fails', function (done) {
          const opts = {
            keyStore: new KeyStore({
              encryption: {
                keys: ['secretsecretsecretsecret'],
                encoding: "base64"
              }
            })
          }
          request(createServer(opts, getCookieHandler('foo', {encrypted: true})))
            .get('/')
            .set('Cookie', 'foo=MTIzNDEyMzQxMjM0MTIzNOYHxZR3iT5J166DoLYrYQc=')
            .expect(200, 'null', done)
        })

        describe('when encryption key matches old key', function () {
          it('should return encrypted value', function (done) {
            const opts = {
              keyStore: new KeyStore({
                encryption: {
                  keys: ['newsecsecretsecretsecret', 'secretsecretsecretsecret'],
                  encoding: "base64"
                }
              })
            }
            request(createServer(opts, getCookieHandler('foo', {encrypted: true})))
              .get('/')
              .set('Cookie', 'foo=xOxYwbV72DCmmzMaSe1XuTDG79GqxDPRaBjXh8bF5jDvoVoF')
              .expect(200, 'ohmytext', done)
          })
        })
      })
    })

    describe('"signed" option', function () {
      describe('when true', function () {
        it('should throw without .keys', function (done) {
          request(createServer(getCookieHandler('foo', {signed: true})))
            .get('/')
            .set('Cookie', 'foo=bar; foo.sig=iW2fuCIzk9Cg_rqLT1CAqrtdWs8')
            .expect(500)
            .expect('Error: keys required for signed cookies')
            .end(done)
        })

        it('should return signed cookie value', function (done) {
          const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
          request(createServer(opts, getCookieHandler('foo', {signed: true})))
            .get('/')
            .set('Cookie', 'foo=bar; foo.sig=iW2fuCIzk9Cg_rqLT1CAqrtdWs8')
            .expect(200, 'bar', done)
        })
        describe('with sign identifier', function () {

          it('should call sign identifier', function (done) {
            const signIdentifier = (name: string) => {
              return name + ".mysig"
            }
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
            request(createServer(opts, getCookieHandler('foo', {
              signed: true,
              signIdentifier
            })))
              .get('/')
              .set('Cookie', 'foo=bar; foo.mysig=iW2fuCIzk9Cg_rqLT1CAqrtdWs8')
              .expect(200, 'bar', done)
          });

          it('should accept sign identifier string', function (done) {
            const signIdentifier = "mysig"
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
            request(createServer(opts, getCookieHandler('foo', {
              signed: true,
              signIdentifier
            })))
              .get('/')
              .set('Cookie', 'foo=bar; foo.mysig=iW2fuCIzk9Cg_rqLT1CAqrtdWs8')
              .expect(200, 'bar', done)
          });
        })
        describe('when signature is invalid', function () {
          it('should return undefined', function (done) {
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
            request(createServer(opts, getCookieHandler('foo', {signed: true})))
              .get('/')
              .set('Cookie', 'foo=bar; foo.sig=v5f380JakwVgx2H9B9nA6kJaZNg')
              .expect(200, 'undefined', done)
          })

          it('should delete signature cookie', function (done) {
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
            request(createServer(opts, getCookieHandler('foo', {signed: true})))
              .get('/')
              .set('Cookie', 'foo=bar; foo.sig=v5f380JakwVgx2H9B9nA6kJaZNg')
              .expect(200)
              .expect('undefined')
              .expect(shouldSetCookieCount(1))
              .expect(shouldSetCookieWithAttributeAndValue('foo.sig', 'expires', 'Thu, 01 Jan 1970 00:00:00 GMT'))
              .end(done)
          })
        })
        describe('when signature does not exist', function () {
          it('should return undefined', function (done) {
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
            request(createServer(opts, getCookieHandler('foo', {signed: true})))
              .get('/')
              .set('Cookie', 'foo=bar;')
              .expect(200, 'undefined', done)
          })
        })

        describe('when signature matches old key', function () {
          it('should return signed value', function (done) {
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat a', 'keyboard cat b']}})}
            request(createServer(opts, getCookieHandler('foo', {signed: true})))
              .get('/')
              .set('Cookie', 'foo=bar; foo.sig=NzdRHeORj7MtAMhSsILYRsyVNI8')
              .expect(200, 'bar', done)
          })

          it('should set signature with new key', function (done) {
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat a', 'keyboard cat b']}})}
            request(createServer(opts, getCookieHandler('foo', {signed: true})))
              .get('/')
              .set('Cookie', 'foo=bar; foo.sig=NzdRHeORj7MtAMhSsILYRsyVNI8')
              .expect(200)
              .expect('bar')
              .expect(shouldSetCookieCount(1))
              .expect(shouldSetCookieToValue('foo.sig', 'tecF04p5ua6TnfYxUTDskgWSKJE'))
              .end(done)
          })
        })
      })
    })

    describe('both "encrypted" and "signed" option',function () {
      it('should return decrypted cookie value', function (done) {
        const opts = {
          keyStore: new KeyStore({
            encryption: {
              keys: ['secretsecretsecretsecret'],
              encoding: "base64"
            },
            signing: {keys: ['keyboard cat']}
          })
        }
        request(createServer(opts, getCookieHandler('foo', {encrypted: true, signed: true})))
          .get('/')
          .set('Cookie', 'foo=xOxYwbV72DCmmzMaSe1XuTDG79GqxDPRaBjXh8bF5jDvoVoF; foo.sig=42gj5_5QQsiAmc0ActXQxZdo9gM')
          .expect(200, 'ohmytext', done)
      })
      it('should return null when signature is invalid', function (done) {
        const opts = {
          keyStore: new KeyStore({
            encryption: {
              keys: ['secretsecretsecretsecret'],
              encoding: "base64"
            },
            signing: {keys: ['keyboard cat']}
          })
        }
        request(createServer(opts, getCookieHandler('foo', {encrypted: true, signed: true})))
          .get('/')
          .set('Cookie', 'foo=xOxYwbV72DCmmzMaSe1XuTDG79GqxDPRaBjXh8bF5jDvoVoF; foo.sig=somesignature')
          .expect(200, 'undefined', done)
      })
    })
  })

  describe('.set(name, value, [options])', function () {
    it('should set cookie', function (done) {
      request(createServer(setCookieHandler('foo', 'bar')))
        .get('/')
        .expect(200)
        .expect(shouldSetCookieToValue('foo', 'bar'))
        .end(done)
    })

    it('should work for cookie name with special characters', function (done) {
      request(createServer(setCookieHandler('foo*(#bar)?.|$', 'buzz')))
        .get('/')
        .expect(200)
        .expect(shouldSetCookieToValue('foo*(#bar)?.|$', 'buzz'))
        .end(done)
    })

    it('should work for cookie value with special characters', function (done) {
      request(createServer(setCookieHandler('foo', '*(#bar)?.|$')))
        .get('/')
        .expect(200)
        .expect(shouldSetCookieToValue('foo', '*(#bar)?.|$'))
        .end(done)
    })

    describe('when value is falsy', function () {
      it('should delete cookie', function (done) {
        request(createServer(setCookieHandler('foo', null)))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieCount(1))
          .expect(shouldSetCookieToValue('foo', ''))
          .expect(shouldSetCookieWithAttributeAndValue('foo', 'expires', 'Thu, 01 Jan 1970 00:00:00 GMT'))
          .end(done)
      })
    })

    describe('"httpOnly" option', function () {
      it('should be set by default', function (done) {
        request(createServer(setCookieHandler('foo', 'bar')))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithAttribute('foo', 'httpOnly'))
          .end(done)
      })

      it('should set to true', function (done) {
        request(createServer(setCookieHandler('foo', 'bar', {httpOnly: true})))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithAttribute('foo', 'httpOnly'))
          .end(done)
      })

      it('should set to false', function (done) {
        request(createServer(setCookieHandler('foo', 'bar', {httpOnly: false})))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithoutAttribute('foo', 'httpOnly'))
          .end(done)
      })
    })

    describe('"domain" option', function () {
      it('should not be set by default', function (done) {
        request(createServer(setCookieHandler('foo', 'bar')))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithoutAttribute('foo', 'domain'))
          .end(done)
      })

      it('should set to custom value', function (done) {
        request(createServer(setCookieHandler('foo', 'bar', {domain: 'foo.local'})))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithAttributeAndValue('foo', 'domain', 'foo.local'))
          .end(done)
      })

      it('should reject invalid value', function (done) {
        request(createServer(setCookieHandler('foo', 'bar', {domain: 'foo\nbar'})))
          .get('/')
          .expect(500, 'TypeError: option domain is invalid', done)
      })
    })

    describe('"maxAge" option', function () {
      it('should set the "expires" attribute', function (done) {
        const maxAge = 86400000
        request(createServer(setCookieHandler('foo', 'bar', {maxAge: maxAge})))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithAttribute('foo', 'expires'))
          .expect(function (res) {
            const cookie = getCookieForName(res, 'foo')
            const expected = new Date(Date.parse(res.headers.date) + maxAge).toUTCString()
            assert.strictEqual(cookie.expires, expected)
          })
          .end(done)
      })

      it('should not set the "maxAge" attribute', function (done) {
        request(createServer(setCookieHandler('foo', 'bar', {maxAge: 86400000})))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithAttribute('foo', 'expires'))
          .expect(shouldSetCookieWithoutAttribute('foo', 'maxAge'))
          .end(done)
      })

      it('should not affect cookie deletion', function (done) {
        request(createServer(setCookieHandler('foo', null, {maxAge: 86400000})))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieCount(1))
          .expect(shouldSetCookieToValue('foo', ''))
          .expect(shouldSetCookieWithAttributeAndValue('foo', 'expires', 'Thu, 01 Jan 1970 00:00:00 GMT'))
          .end(done)
      })
    })

    describe('"overwrite" option', function () {
      it('should be off by default', function (done) {
        request(createServer(function (_req: any, res: any, cookies: any) {
          cookies.set('foo', 'bar')
          cookies.set('foo', 'baz')
          res.end()
        }))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieCount(2))
          .expect(shouldSetCookieToValue('foo', 'bar'))
          .end(done)
      })

      it('should overwrite same cookie by name when true', function (done) {
        request(createServer(function (_req: any, res: any, cookies: any) {
          cookies.set('foo', 'bar')
          cookies.set('foo', 'baz', {overwrite: true})
          res.end()
        }))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieCount(1))
          .expect(shouldSetCookieToValue('foo', 'baz'))
          .end(done)
      })

      it('should overwrite based on name only', function (done) {
        request(createServer(function (_req: any, res: any, cookies: any) {
          cookies.set('foo', 'bar', {path: '/foo'})
          cookies.set('foo', 'baz', {path: '/bar', overwrite: true})
          res.end()
        }))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieCount(1))
          .expect(shouldSetCookieToValue('foo', 'baz'))
          .expect(shouldSetCookieWithAttributeAndValue('foo', 'path', '/bar'))
          .end(done)
      })
    })

    describe('"path" option', function () {
      it('should default to "/"', function (done) {
        request(createServer(setCookieHandler('foo', 'bar')))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithAttributeAndValue('foo', 'path', '/'))
          .end(done)
      })

      it('should set to custom value', function (done) {
        request(createServer(setCookieHandler('foo', 'bar', {path: '/admin'})))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithAttributeAndValue('foo', 'path', '/admin'))
          .end(done)
      })

      it('should set to ""', function (done) {
        request(createServer(setCookieHandler('foo', 'bar', {path: ''})))
          .get('/')
          .expect(200)
          .expect(shouldSetCookieWithoutAttribute('foo', 'path'))
          .end(done)
      })

      it('should reject invalid value', function (done) {
        request(createServer(setCookieHandler('foo', 'bar', {path: 'foo\nbar'})))
          .get('/')
          .expect(500, 'TypeError: option path is invalid', done)
      })
    })

    describe('"secure" option', function () {
      describe('when true', function () {
        it('should throw on unencrypted connection', function (done) {
          request(createServer(setCookieHandler('foo', 'bar', {secure: true})))
            .get('/')
            .expect(500)
            .expect('Error: Cannot send secure cookie over unencrypted connection')
            .end(done)
        })

        it('should set secure attribute on encrypted connection', function (done) {
          const server: any = createSecureServer(setCookieHandler('foo', 'bar', {secure: true}))

          request(server)
            .get('/')
            .ca(server.cert)
            .expect(200)
            .expect(shouldSetCookieWithAttribute('foo', 'Secure'))
            .end(done)
        })

        describe('with "secure: true" constructor option', function () {
          it('should set secure attribute on unencrypted connection', function (done) {
            const opts = {secure: true}

            request(createServer(opts, setCookieHandler('foo', 'bar', {secure: true})))
              .get('/')
              .expect(200)
              .expect(shouldSetCookieWithAttribute('foo', 'Secure'))
              .end(done)
          })
        })

        describe('with req.protocol === "https"', function () {
          it('should set secure attribute on unencrypted connection', function (done) {
            request(createServer(function (req: any, res: any, cookies: any) {
              req.protocol = 'https'
              cookies.set('foo', 'bar', {secure: true})
              res.end()
            }))
              .get('/')
              .expect(200)
              .expect(shouldSetCookieWithAttribute('foo', 'Secure'))
              .end(done)
          })
        })
      })

      describe('when undefined', function () {
        it('should set secure attribute on encrypted connection', function (done) {
          const server: any = createSecureServer(setCookieHandler('foo', 'bar', {secure: undefined}))

          request(server)
            .get('/')
            .ca(server.cert)
            .expect(200)
            .expect(shouldSetCookieWithAttribute('foo', 'Secure'))
            .end(done)
        })

        describe('with "secure: undefined" constructor option', function () {
          it('should not set secure attribute on unencrypted connection', function (done) {
            const opts = {secure: undefined}

            request(createServer(opts, setCookieHandler('foo', 'bar', {secure: undefined})))
              .get('/')
              .expect(200)
              .expect(shouldSetCookieWithoutAttribute('foo', 'Secure'))
              .end(done)
          })
        })

        describe('with req.protocol === "https"', function () {
          it('should set secure attribute on unencrypted connection', function (done) {
            request(createServer(function (req: any, res: any, cookies: any) {
              req.protocol = 'https'
              cookies.set('foo', 'bar', {secure: undefined})
              res.end()
            }))
              .get('/')
              .expect(200)
              .expect(shouldSetCookieWithAttribute('foo', 'Secure'))
              .end(done)
          })
        })
      })
    })

    describe('"encrypted" option', function () {
      describe('when true', function () {
        it('should throw without .keys', function (done) {
          request(createServer(setCookieHandler('foo', 'bar', {encrypted: true})))
            .get('/')
            .expect(500)
            .end(done)
        })
        it('should set encrypted value', function (done) {
          const opts = {
            keyStore: new KeyStore({
              encryption: {
                keys: ['secretsecretsecretsecret'],
                encoding: "base64"
              }
            })
          }

          request(createServer(opts, setCookieHandler('foo', 'ohmytext', {encrypted: true})))
            .get('/')
            .expect(200)
            .expect(shouldSetCookieCount(2))
            .expect(shouldSetCookieToValue('foo', 'xOxYwbV72DCmmzMaSe1XuTDG79GqxDPRaBjXh8bF5jDvoVoF'))
            .end(done)
        });
      })
    })

    describe('"signed" option', function () {
      describe('when true', function () {
        it('should throw without .keys', function (done) {
          request(createServer(setCookieHandler('foo', 'bar', {signed: true})))
            .get('/')
            .expect(500)
            .end(done)
        })

        it('should set additional .sig cookie', function (done) {
          const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}

          request(createServer(opts, setCookieHandler('foo', 'bar', {signed: true})))
            .get('/')
            .expect(200)
            .expect(shouldSetCookieCount(2))
            .expect(shouldSetCookieToValue('foo', 'bar'))
            .expect(shouldSetCookieToValue('foo.sig', 'iW2fuCIzk9Cg_rqLT1CAqrtdWs8'))
            .end(done)
        })

        it('should call signIdentifier', function (done) {
          const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
          const signIdentifier = (name: string) => {
            return name + ".mysig"
          }
          request(createServer(opts, setCookieHandler('foo', 'bar', {
              signed: true,
            signIdentifier
            })
          ))
            .get('/')
            .expect(200)
            .expect(shouldSetCookieCount(2))
            .expect(shouldSetCookieToValue('foo', 'bar'))
            .expect(shouldSetCookieToValue('foo.mysig', 'iW2fuCIzk9Cg_rqLT1CAqrtdWs8'))
            .end(done)
        });
        it('should accept append sign identifier string', function (done) {
          const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
          const signIdentifier = "mysig"
          request(createServer(opts, setCookieHandler('foo', 'bar', {
              signed: true,
              signIdentifier
            })
          ))
            .get('/')
            .expect(200)
            .expect(shouldSetCookieCount(2))
            .expect(shouldSetCookieToValue('foo', 'bar'))
            .expect(shouldSetCookieToValue('foo.mysig', 'iW2fuCIzk9Cg_rqLT1CAqrtdWs8'))
            .end(done)
        });

        it('should use first key for signature', function (done) {
          const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat a', 'keyboard cat b']}})}
          request(createServer(opts, setCookieHandler('foo', 'bar', {signed: true})))
            .get('/')
            .expect(200)
            .expect(shouldSetCookieCount(2))
            .expect(shouldSetCookieToValue('foo', 'bar'))
            .expect(shouldSetCookieToValue('foo.sig', 'tecF04p5ua6TnfYxUTDskgWSKJE'))
            .end(done)
        })

        describe('when value is falsy', function () {
          it('should delete additional .sig cookie', function (done) {
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
            request(createServer(opts, setCookieHandler('foo', null, {signed: true})))
              .get('/')
              .expect(200)
              .expect(shouldSetCookieCount(2))
              .expect(shouldSetCookieToValue('foo', ''))
              .expect(shouldSetCookieWithAttributeAndValue('foo', 'expires', 'Thu, 01 Jan 1970 00:00:00 GMT'))
              .expect(shouldSetCookieWithAttributeAndValue('foo.sig', 'expires', 'Thu, 01 Jan 1970 00:00:00 GMT'))
              .end(done)
          })
        })

        describe('with "path"', function () {
          it('should set additional .sig cookie with path', function (done) {
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}

            request(createServer(opts, setCookieHandler('foo', 'bar', {signed: true, path: '/admin'})))
              .get('/')
              .expect(200)
              .expect(shouldSetCookieCount(2))
              .expect(shouldSetCookieWithAttributeAndValue('foo', 'path', '/admin'))
              .expect(shouldSetCookieWithAttributeAndValue('foo.sig', 'path', '/admin'))
              .end(done)
          })
        })

        describe('with "overwrite"', function () {
          it('should set additional .sig cookie with httpOnly', function (done) {
            const opts = {keyStore: new KeyStore({signing: {keys: ['keyboard cat']}})}
            request(createServer(opts, function (_req: any, res: any, cookies: any) {
              cookies.set('foo', 'bar', {signed: true})
              cookies.set('foo', 'baz', {signed: true, overwrite: true})
              res.end()
            }))
              .get('/')
              .expect(200)
              .expect(shouldSetCookieCount(2))
              .expect(shouldSetCookieToValue('foo', 'baz'))
              .expect(shouldSetCookieToValue('foo.sig', 'ptOkbbiPiGfLWRzz1yXP3XqaW4E'))
              .end(done)
          })
        })

      })
    })
  })
})

function assertServer(done: DoneCallback, testFn: any) {
  const server = http.createServer(function (req: any, res: any) {
    try {
      testFn(req, res)
      res.end('OK')
    } catch (e: any) {
      res.statusCode = 500
      res.end(e.name + ': ' + e.message)
    }
  })

  request(server)
    .get('/')
    .expect('OK')
    .expect(200)
    .end(done)
}

function createRequestListener(options: any, handler?: any) {
  const next = handler || options
  const opts = next === options ? undefined : options

  return function (req: any, res: any) {
    const cookies = new Cookies(req, res, opts)

    try {
      next(req, res, cookies)
    } catch (e: any) {
      res.statusCode = 500
      res.end(e.name + ': ' + e.message)
    }
  }
}

function createSecureServer(options: any, handler?: any) {
  const cert = fs.readFileSync(path.join(__dirname, 'fixtures', 'server.crt'), 'ascii')
  const key = fs.readFileSync(path.join(__dirname, 'fixtures', 'server.key'), 'ascii')

  return https.createServer({cert: cert, key: key})
    .on('request', createRequestListener(options, handler))
}

function createServer(options: any, handler?: any) {
  return http.createServer()
    .on('request', createRequestListener(options, handler))
}

function getCookieForName(res: any, name: string) {
  const cookies = getCookies(res)

  for (let i = 0; i < cookies.length; i++) {
    if (cookies[i].name === name) {
      return cookies[i]
    }
  }
}

function getCookieHandler(name: string, options?: Partial<CookiesOptions>) {
  return function (_req: any, res: any, cookies: any) {
    res.end(String(cookies.get(name, options)))
  }
}

function getCookies(res: any) {
  const setCookies = res.headers['set-cookie'] || []
  return setCookies.map(parseSetCookie)
}

function parseSetCookie(header: string) {
  let match: any
  const pairs = []
  const pattern = /\s*([^=;]+)(?:=([^;]*);?|;|$)/g

  while ((match = pattern.exec(header))) {
    pairs.push({name: match[1], value: match[2]})
  }

  const cookie: any = pairs.shift()

  for (let i = 0; i < pairs.length; i++) {
    match = pairs[i]
    cookie[match.name.toLowerCase()] = (match.value || true)
  }

  return cookie
}

function setCookieHandler(name: string, value: string | null, options?: Partial<SetCookieOptions>) {
  return function (_req: any, res: any, cookies: Cookies) {
    cookies.set(name, value, options!)
    res.end()
  }
}

function shouldSetCookieCount(num: number) {
  return function (res: any) {
    const count = getCookies(res).length
    assert.equal(count, num, 'should set cookie ' + num + ' times')
  }
}

function shouldSetCookieToValue(name: string, val: string) {
  return function (res: any) {
    const cookie = getCookieForName(res, name)
    assert.ok(cookie, 'should set cookie ' + name)
    assert.equal(cookie.value, val, 'should set cookie ' + name + ' to ' + val)
  }
}

function shouldSetCookieWithAttribute(name: string, attrib: string) {
  return function (res: any) {
    const cookie = getCookieForName(res, name)
    assert.ok(cookie, 'should set cookie ' + name)
    assert.ok((attrib.toLowerCase() in cookie), 'should set cookie with attribute ' + attrib)
  }
}

function shouldSetCookieWithAttributeAndValue(name: string, attrib: string, value: string) {
  return function (res: any) {
    const cookie = getCookieForName(res, name)
    assert.ok(cookie, 'should set cookie ' + name)
    assert.ok((attrib.toLowerCase() in cookie), 'should set cookie with attribute ' + attrib)
    assert.equal(cookie[attrib.toLowerCase()], value, 'should set cookie with attribute ' + attrib + ' set to ' + value)
  }
}

function shouldSetCookieWithoutAttribute(name: string, attrib: string) {
  return function (res: any) {
    const cookie = getCookieForName(res, name)
    assert.ok(cookie, 'should set cookie ' + name)
    assert.ok(!(attrib.toLowerCase() in cookie), 'should set cookie without attribute ' + attrib)
  }
}
