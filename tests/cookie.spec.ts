/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Cookie } from "../src";

import assert from "assert";

describe('new Cookie(name, value, [options])', function () {
  it('should have correct constructor', function () {
    const cookie = new Cookie('foo', 'bar')
    assert.equal(cookie.constructor, Cookie)
  })

  it('should throw on invalid name', function () {
    assert.throws(function () {
      new Cookie('foo\n', 'bar')
    }, /argument name is invalid/)
  })

  it('should throw on invalid value', function () {
    assert.throws(function () {
      new Cookie('foo', 'bar\n')
    }, /argument value is invalid/)
  })

  it('should throw on invalid path', function () {
    assert.throws(function () {
      new Cookie('foo', 'bar', { path: '/\n' })
    }, /option path is invalid/)
  })

  it('should throw on invalid domain', function () {
    assert.throws(function () {
      new Cookie('foo', 'bar', { domain: 'example.com\n' })
    }, /option domain is invalid/)
  })

  describe('options', function () {
    describe('maxAge', function () {
      it('should set the .maxAge property', function () {
        const cookie = new Cookie('foo', 'bar', { maxAge: 86400 })
        assert.equal(cookie.maxAge, 86400)
      })

      it('should set the .maxAge property', function () {
        const cookie = new Cookie('foo', 'bar', { maxAge: 86400 })
        assert.equal(cookie.maxAge, 86400)
      })
    })

    describe('maxAge', function () {
      it('should set the .maxAge property', function () {
        const cookie = new Cookie('foo', 'bar', { maxAge: 86400 })
        assert.equal(cookie.maxAge, 86400)
      })

      it('should set the .maxAge property', function () {
        const cookie = new Cookie('foo', 'bar', { maxAge: 86400 })
        assert.equal(cookie.maxAge, 86400)
      })
    })

    describe('sameSite', function () {
      it('should set the .sameSite property', function () {
        const cookie = new Cookie('foo', 'bar', { sameSite: true })
        assert.equal(cookie.sameSite, true)
      })

      it('should default to false', function () {
        const cookie = new Cookie('foo', 'bar')
        assert.equal(cookie.sameSite, false)
      })

      it('should throw on invalid value', function () {
        assert.throws(function () {
          // @ts-expect-error
          new Cookie('foo', 'bar', { sameSite: 'foo' })
        }, /option sameSite is invalid/)
      })

      describe('when set to "false"', function () {
        it('should not set "samesite" attribute in header', function () {
          const cookie = new Cookie('foo', 'bar', { sameSite: false })
          assert.equal(cookie.header, 'foo=bar; path=/; httponly')
        })
      })

      describe('when set to "true"', function () {
        it('should set "samesite=strict" attribute in header', function () {
          const cookie = new Cookie('foo', 'bar', { sameSite: true })
          assert.equal(cookie.header, 'foo=bar; path=/; samesite=strict; httponly')
        })
      })

      describe('when set to "lax"', function () {
        it('should set "samesite=lax" attribute in header', function () {
          const cookie = new Cookie('foo', 'bar', { sameSite: 'lax' })
          assert.equal(cookie.header, 'foo=bar; path=/; samesite=lax; httponly')
        })
      })

      describe('when set to "none"', function () {
        it('should set "samesite=none" attribute in header', function () {
          const cookie = new Cookie('foo', 'bar', { sameSite: 'none' })
          assert.equal(cookie.header, 'foo=bar; path=/; samesite=none; httponly')
        })
      })

      describe('when set to "strict"', function () {
        it('should set "samesite=strict" attribute in header', function () {
          const cookie = new Cookie('foo', 'bar', { sameSite: 'strict' })
          assert.equal(cookie.header, 'foo=bar; path=/; samesite=strict; httponly')
        })
      })

      describe('when set to "STRICT"', function () {
        it('should set "samesite=strict" attribute in header', function () {
          // @ts-expect-error
          const cookie = new Cookie('foo', 'bar', { sameSite: 'STRICT' })
          assert.equal(cookie.header, 'foo=bar; path=/; samesite=strict; httponly')
        })
      })
    })
  })
})
