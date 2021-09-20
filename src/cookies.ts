import http, { IncomingMessage, ServerResponse } from 'http';
import { Cookie, CookieAttrs } from './cookie';
import {KeyStore} from "./keystore";
import type {Http2ServerRequest, Http2ServerResponse} from "http2";

const cache: { [key:string]: RegExp } = {} as any;

export type CookiesOptions = {
  keyStore?: KeyStore;
  signed?: boolean;
  encrypted?: boolean;
  secure?: boolean | undefined;
  /**
   * If string, provided value will be appended cookie name with dot. For example with given value `mysig`
   * signature cookie name will be `cookiename.mysig`
   *
   * @default `sig`
   */
  signIdentifier?: string | ((name: string) => string)
}

export type SetCookies = CookiesOptions & CookieAttrs
export type GetCookies = CookiesOptions

export class Cookies {
  /**
   * Mark cookies as secure by default.
   * @default `req.protocol`
   */
  secure?: boolean | undefined;

  /**
   * Encrypt cookies by default and assume received cookies are encrypted.
   * @default false
   */
  encrypted: boolean;

  /**
   * Sign cookies by default and assume received cookies are signed
   * @default false
   */
  signed: boolean;

  keyStore: KeyStore;

  signIdentifier?: CookiesOptions['signIdentifier']

  readonly request: IncomingMessage | Http2ServerRequest;
  readonly response: ServerResponse | Http2ServerResponse;

  constructor(request: IncomingMessage | Http2ServerRequest, response: ServerResponse | Http2ServerResponse, options: CookiesOptions = {}) {
    this.request = request;
    this.response = response;

    this.keyStore = options.keyStore || new KeyStore();
    this.secure = options.secure;
    this.signed = options.signed !== undefined ? options.signed : false;
    this.encrypted = options.encrypted !== undefined ? options.encrypted : false;
    this.signIdentifier = options.signIdentifier || 'sig';
  }

  get(name: string, opts?: GetCookies) {
    const sigId = opts?.signIdentifier || this.signIdentifier;

    const sigName =  typeof sigId === 'function' ? sigId.call(null, name)
      : `${name + '.'+ sigId}`;

    const signed = opts && opts.signed !== undefined ? opts.signed : this.keyStore.signing.keys.length > 0;

    const encrypted = opts && opts.encrypted !== undefined ? opts.encrypted : this.encrypted;

    const header = this.request.headers['cookie'];
    if (!header) {
      return undefined;
    }

    const match = header.match(getPattern(name));
    if (!match) {
      return undefined;
    }

    const value = match[1];
    if (!opts || !signed) {
      return encrypted ? this.keyStore.decrypt(value as string) : value;
    }

    const remote = this.get(sigName, { encrypted: false, signed: false });
    if (!remote) {
      return undefined;
    }

    const data = `${name}=${value}`;
    const index = this.keyStore.indexOf(data, remote);

    if (index < 0) {
      this.set(sigName, null, { path: '/', signed: false });
      return undefined
    } else {
      index && this.set(sigName, this.keyStore.sign(data), { signed: false });
      return encrypted ? this.keyStore.decrypt(value as string) : value;
    }
  }

  set(name: string, value: string | null, opts: SetCookies) {
    const res = this.response;
    const req = this.request;
    let headers = (res.getHeader('Set-Cookie') || []) as string[];
    const secure = this.secure !== undefined ? !!this.secure : (<any>req).protocol === 'https' || (<any>req).connection['encrypted'];
    const encrypted = opts && opts.encrypted !== undefined ? opts.encrypted : this.encrypted;

    if(value !== null && encrypted){
      value = this.keyStore.encrypt(value as string);
    }

    const cookie = new Cookie(name, value, opts);
    const signed = opts && opts.signed !== undefined ? opts.signed : this.signed;

    if (typeof headers == 'string') {
      /* istanbul ignore next */
      headers = [headers];
    }

    if (!secure && opts && opts.secure) {
      throw new Error('Cannot send secure cookie over unencrypted connection');
    }

    cookie.secure = opts && opts.secure !== undefined
      ? opts.secure
      : secure;

    pushCookie(headers, cookie);

    if (opts && signed) {
      cookie.value = this.keyStore.sign(cookie.toString());

      const sigId = opts.signIdentifier || this.signIdentifier;

      cookie.name = typeof sigId === 'function' ? sigId.call(null, cookie.name)
        : `${cookie.name + '.'+ sigId}`;
      pushCookie(headers, cookie);
    }

    const setHeader = (<any>res)["set"] ? http.OutgoingMessage.prototype.setHeader : res.setHeader;
    setHeader.call(res, 'Set-Cookie', headers);
    return this;
  }

  static middleware = (options?: CookiesOptions) => (req: any, res: any, next: any) => {
    req.cookies = res.cookies = new Cookies(req, res, options);

    next();
  }
  static connect = Cookies.middleware
  static express = Cookies.middleware
  static koa = (options?: CookiesOptions) => (ctx: any, next: any) => {
    ctx.cookies = ctx.req.cookies = ctx.res.cookies = ctx.request.cookies = ctx.response.cookies = new Cookies(ctx.req, ctx.res, options)
    next()
  }
}


function getPattern(name: string): RegExp {
  if (cache[name]) {
    return cache[name] as RegExp;
  }

  return cache[name] = new RegExp(
    `(?:^|;) *${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}=([^;]*)`
  );
}

function pushCookie(headers: string[], cookie: Cookie) {
  if (cookie.overwrite) {
    for (let i = headers.length - 1; i >= 0; i--) {
      if (headers[i]!.indexOf(`${cookie.name}=`) === 0) {
        headers.splice(i, 1);
      }
    }
  }

  headers.push(cookie.header);
}
