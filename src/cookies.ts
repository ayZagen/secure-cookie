import http, {IncomingMessage, ServerResponse} from 'http';
import {Cookie, CookieAttrs} from './cookie';
import {KeyStore} from "./keystore";
import type {Http2ServerRequest, Http2ServerResponse} from "http2";

const cache: { [key: string]: RegExp } = {} as any;
type SignIdentifier = string | ((name: string) => string)
export type CookiesOptions = {

  /**
   * KeyStore to be used for signing and encrypting
   */
  keyStore?: KeyStore;
  /**
   * a boolean indicating whether the cookie is to be signed (`false` by default). If this is true, another cookie of the same name with the `signIdentifier` will also be sent, with a 27-byte url-safe base64 SHA1 value representing the hash of _cookie-name_=_cookie-value_ against the first [KeyStore](keystore) key. This signature key is used to detect tampering the next time a cookie is received.
   * @default false
   */
  signed?: boolean;
  /**
   * Encrypt cookies by default and assume received cookies are encrypted.
   * @default false
   */
  encrypted?: boolean;
  /**
   * Mark cookies as secure by default.
   * @default `req.protocol`
   */
  secure?: boolean | undefined;
  /**
   * If string, provided value will be appended cookie name with dot. For example with given value `mysig`
   * signature cookie name will be `cookiename.mysig`
   *
   * @default `sig`
   */
  signIdentifier?: SignIdentifier
}

export type SetCookieOptions = CookiesOptions & CookieAttrs
export type GetCookieOptions = CookiesOptions

export class Cookies {

  secure?: CookiesOptions["secure"];

  encrypted: boolean;

  signed: boolean;

  keyStore: KeyStore;

  signIdentifier?: SignIdentifier

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

  /**
   * This extracts the cookie with the given name from the Set-Cookie header in the request. If such a cookie exists, its value is returned. Otherwise, nothing is returned.
   *
   * `{ signed: true }` can optionally be passed as the second parameter options. In this case, a signature cookie (a cookie of same name ending with the .sig suffix appended) is fetched. If no such cookie exists, nothing is returned.
   *
   * If the signature cookie does exist, the provided KeyStore is used to check whether the hash of cookie-name=cookie-value matches that of any registered key/s:
   *
   * - If the signature cookie hash matches the first key, the original cookie value is returned.
   * - If the signature cookie hash matches any other key, the original cookie value is returned AND an outbound header is set to update the signature cookie's value to the hash of the first key. This enables automatic freshening of signature cookies that have become stale due to key rotation.
   * - If the signature cookie hash does not match any key, nothing is returned, and an outbound header with an expired date is used to delete the cookie.
   *
   * `{ encrypted: true }` can optionally be passed as the second parameter options. In this case, the provided KeyStore will try to decrypt the cookie value with registered key/s.
   *
   * - If the decryption fails nothing is returned, and the cookie stays intact.
   * - If decryption succeeds, decrypted cookie value is returned.
   *
   * If both `signed` and `encrypted` options are provided, signature check will be applied with encrypted value. Than the decryption will be applied.
   * @param name
   * @param opts
   */
  get(name: string, opts?: GetCookieOptions): string | undefined {
    const sigId = opts?.signIdentifier || this.signIdentifier;

    const sigName = typeof sigId === 'function' ? sigId.call(null, name)
      : `${name + '.' + sigId}`;

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

    const remote = this.get(sigName, {encrypted: false, signed: false});
    if (!remote) {
      return undefined;
    }

    const data = `${name}=${value}`;
    const index = this.keyStore.indexOf(data, remote);

    if (index < 0) {
      this.set(sigName, null, {path: '/', signed: false});
      return undefined
    } else {
      index && this.set(sigName, this.keyStore.sign(data), {signed: false});
      return encrypted ? this.keyStore.decrypt(value as string) : value;
    }
  }

  /**
   * This sets the given cookie in the response and returns the current context to allow chaining.
   *
   * @param name Cookie name
   * @param value Cookie value. If this is omitted, an outbound header with an expired date is used to delete the cookie.
   * @param opts Overridden options
   */
  set(name: string, value?: string | null, opts?: SetCookieOptions): Cookies {
    const res = this.response,
      req = this.request,
      secure = this.secure !== undefined ? !!this.secure : (<any>req).protocol === 'https' || (<any>req).connection['encrypted'],
      encrypted = opts && opts.encrypted !== undefined ? opts.encrypted : this.encrypted;

    let headers = (res.getHeader('Set-Cookie') || []) as string[];

    const cookie = new Cookie(name, encrypted ? this.keyStore.encrypt(value as string): value, opts);
    const signed = opts && opts.signed !== undefined ? opts.signed : this.signed;

    /* istanbul ignore next */
    if (typeof headers == 'string') {
      headers = [headers];
    }

    if (!secure && opts && opts.secure) {
      throw new Error('Cannot send secure cookie over unencrypted connection');
    }

    cookie.secure = opts && opts.secure !== undefined ? opts.secure : secure;

    pushCookie(headers, cookie);

    if (opts && signed) {
      cookie.value = this.keyStore.sign(cookie.toString());

      const sigId = opts.signIdentifier || this.signIdentifier;

      if (typeof sigId === 'function') {
        cookie.name = sigId.call(null, cookie.name);
      } else {
        cookie.name = `${cookie.name + '.' + sigId}`;
      }
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
    ctx.cookies
      = ctx.req.cookies
      = ctx.res.cookies
      = ctx.request.cookies
      = ctx.response.cookies = new Cookies(ctx.req, ctx.res, options)
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
