/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
// noinspection TypeScriptValidateJSTypes

import assert from "assert";
import { Cookies } from "../src";
import request from "supertest";
import {KeyStore} from "../src";


const keyStore = new KeyStore({
  signing: {
    keys: ['a', 'b']
  }
})

const cookies = Cookies.koa

const koa = tryRequire('koa')
const koaRouter = tryRequire('koa-router')

let app: any
describe('Koa', function () {

  it('should set a cookie on the response', function (done) {
    app = new koa()
    const router = new koaRouter()
    app.use(cookies())
    router.get('/', function (ctx: any) {
      ctx.status = 200
      ctx.cookies.set('foo', 'bar')
    })
    app.use(router.routes())

    request(app.listen())
      .get('/')
      .expect(shouldSetCookies([
        { name: 'foo', value: 'bar', path: '/', httponly: true }
      ]))
      .expect(200, done)
  })

  it('should get a cookie from the request', function (done) {
    app = new koa()
    const router = new koaRouter()

    app.use(cookies())
    router.get('/', function (ctx: any) {
      ctx.body = { foo: String(ctx.cookies.get('foo')) }
      ctx.status = 200
    })
    app.use(router.routes())

    request(app.listen())
      .get('/')
      .set('cookie', 'foo=bar')
      .expect(200, { foo: 'bar' }, done)
  })

  describe('with multiple cookies', function () {
    it('should set all cookies on the response', function (done) {
      app = new koa()
      const router = new koaRouter()

      app.use(cookies())
      router.get('/', function (ctx: any) {
        ctx.cookies.set('foo', 'bar')
        ctx.cookies.set('fizz', 'buzz')
        ctx.status = 200
      })
      app.use(router.routes())

      request(app.listen())
        .get('/')
        .expect(shouldSetCookies([
          { name: 'foo', value: 'bar', path: '/', httponly: true },
          { name: 'fizz', value: 'buzz', path: '/', httponly: true }
        ]))
        .expect(200, done)
    })

    it('should get each cookie from the request', function (done) {
      app = new koa()
      const router = new koaRouter()

      app.use(cookies())
      router.get('/', function (ctx: any) {
        ctx.status = 200
        ctx.body = {
          fizz: String(ctx.cookies.get('fizz')),
          foo: String(ctx.cookies.get('foo'))
        }
      })
      app.use(router.routes())

      request(app.listen())
        .get('/')
        .set('cookie', 'foo=bar; fizz=buzz')
        .expect(200, { foo: 'bar', fizz: 'buzz' }, done)
    })
  })

  describe('when "overwrite: false"', function () {
    it('should set second cookie with same name', function (done) {
      app = new koa()
      const router = new koaRouter()

      app.use(cookies())
      router.get('/', function (ctx: any) {
        ctx.cookies.set('foo', 'bar')
        ctx.cookies.set('foo', 'fizz', { overwrite: false })
        ctx.status = 200
      })
      app.use(router.routes())

      request(app.listen())
        .get('/')
        .expect(shouldSetCookies([
          { name: 'foo', value: 'bar', path: '/', httponly: true },
          { name: 'foo', value: 'fizz', path: '/', httponly: true }
        ]))
        .expect(200, done)
    })
  })

  describe('when "overwrite: true"', function () {
    it('should replace previously set value', function (done) {
      app = new koa()
      const router = new koaRouter()

      app.use(cookies())
      router.get('/', function (ctx: any) {
        ctx.cookies.set('foo', 'bar')
        ctx.cookies.set('foo', 'fizz', { overwrite: true })
        ctx.status = 200
      })
      app.use(router.routes())

      request(app.listen())
        .get('/')
        .expect(shouldSetCookies([
          { name: 'foo', value: 'fizz', path: '/', httponly: true }
        ]))
        .expect(200, done)
    })

    it('should set signature correctly', function (done) {
      app = new koa()
      const router = new koaRouter()

      router.get('/', function (ctx: any) {
        ctx.cookies.set('foo', 'bar')
        ctx.cookies.set('foo', 'fizz', { overwrite: true })
        ctx.status = 200
      })
      app.use(router.routes())

      request(app.listen())
        .get('/')
        .expect(shouldSetCookies([
          { name: 'foo', value: 'fizz', path: '/', httponly: true },
          { name: 'foo.sig', value: 'hVIYdxZSelh3gIK5wQxzrqoIndU', path: '/', httponly: true }
        ]))
        .expect(200, done)
    })
  })

  describe('when "secure: true"', function () {
    it('should not set when not secure', function (done) {
      app = new koa()
      const router = new koaRouter()

      app.use(cookies({keyStore}))
      router.get('/', (ctx: any) => {
        try{
          ctx.cookies.set('foo', 'bar', {secure: true})
          ctx.status = 200
        }catch (e: any){
          ctx.status = 500
          ctx.body = e.message
        }
      })
      app.use(router.routes())

      request(app.listen())
        .get('/')
        .expect(500, /Cannot send secure cookie over unencrypted connection/, done)
    })

    it('should set for secure connection', function (done) {
      app = new koa()

      app.use(cookies({keyStore}))
      app.use(function (ctx:any, next: any) {
        ctx.res.connection.encrypted = true
        next()
      } as any)
      app.use(function (ctx: any) {
        ctx.cookies.set('foo', 'bar', {secure: true})
        ctx.status = 200
      } as any)

      request(app.listen())
        .get('/')
        .expect(shouldSetCookies([
          { name: 'foo', value: 'bar', path: '/', httponly: true, secure: true },
          { name: 'foo.sig', value: 'p5QVCZeqNBulWOhYipO0jqjrzz4', path: '/', httponly: true, secure: true }
        ]))
        .expect(200, done)
    })
  })
})

function getCookies (res: any) {
  const setCookies = res.headers['set-cookie'] || []
  return setCookies.map(parseSetCookie)
}

function parseSetCookie (header: string) {
  let match: any
  const pairs = []
  const pattern = /\s*([^=;]+)(?:=([^;]*);?|;|$)/g

  while ((match = pattern.exec(header))) {
    pairs.push({ name: match[1], value: match[2] })
  }

  const cookie: any = pairs.shift()

  for (let i = 0; i < pairs.length; i++) {
    match = pairs[i]
    cookie[match.name.toLowerCase()] = (match.value || true)
  }

  return cookie
}

function shouldSetCookies (expected: any) {
  return function (res: any) {
    assert.deepEqual(getCookies(res), expected)
  }
}

function tryRequire (name: string) {
  try {
    return require(name)
  } catch (e) {
    return undefined
  }
}
