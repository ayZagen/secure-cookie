// eslint-disable-next-line no-control-regex
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
const SAME_SITE_REGEXP = /^(?:lax|none|strict)$/i;

export interface CookieAttrs {
  /**
   * a `Date` object indicating the cookie's expiration date (expires at the end of session by default).
   */
  expires?: Date;
  /**
   * a number representing the milliseconds from `Date.now()` for expiry
   */
  maxAge?: number | null;
  /**
   * a boolean or string indicating whether the cookie is a "same site" cookie (`false` by default). This can be set to `'strict'`, `'lax'`, `'none'`, or `true` (which maps to `'strict'`).
   */
  sameSite?: 'lax' | 'none' | 'strict' | boolean;
  /**
   * a string indicating the path of the cookie (`/` by default).
   */
  path?: string;
  /**
   * a string indicating the domain of the cookie (no default).
   */
  domain?: string;
  /**
   * a boolean indicating whether the cookie is only to be sent over HTTPS (`false` by default for HTTP, `true` by default for HTTPS).
   */
  secure?: boolean | undefined;
  /**
   * a boolean indicating whether the cookie is only to be sent over HTTP(S), and not made available to client JavaScript (`true` by default).
   */
  httpOnly?: boolean;
  /**
   * a boolean indicating whether to overwrite previously set cookies of the same name (`false` by default). If this is true, all cookies set during the same request with the same name (regardless of path or domain) are filtered out of the Set-Cookie header when setting this cookie.
   */
  overwrite?: boolean;
}

export class Cookie implements CookieAttrs {
  name: string;
  value: string;
  domain?: string;
  path = '/';
  sameSite?: CookieAttrs['sameSite'] = false;
  secure = false;
  httpOnly = true;
  overwrite = false;
  expires?: Date;
  maxAge?: number | null;

  constructor(name: string, value: string | null, attrs?: CookieAttrs) {
    if (!fieldContentRegExp.test(name)) {
      throw new TypeError('argument name is invalid');
    }

    if (value && !fieldContentRegExp.test(value)) {
      throw new TypeError('argument value is invalid');
    }

    this.name = name;
    this.value = value || '';

    Object.assign(this, attrs)

    if (!this.value) {
      this.expires = new Date(0);
      this.maxAge = null;
    }

    if (this.path && !fieldContentRegExp.test(this.path)) {
      throw new TypeError('option path is invalid');
    }

    if (this.domain && !fieldContentRegExp.test(this.domain)) {
      throw new TypeError('option domain is invalid');
    }

    if (this.sameSite && this.sameSite !== true && !SAME_SITE_REGEXP.test(this.sameSite)) {
      throw new TypeError('option sameSite is invalid');
    }
  }

  toString() {
    return `${this.name}=${this.value}`;
  }

  get header() {
    let header = this.toString();

    if (this.maxAge) {
      this.expires = new Date(Date.now() + this.maxAge);
    }

    if (this.path) {
      header += `; path=${this.path}`;
    }
    if (this.expires) {
      header += `; expires=${this.expires.toUTCString()}`;
    }
    if (this.domain) {
      header += `; domain=${this.domain}`;
    }
    if (this.sameSite) {
      header += `; samesite=${this.sameSite === true ? 'strict' : this.sameSite.toLowerCase()}`;
    }
    if (this.secure) {
      header += '; secure';
    }
    if (this.httpOnly) {
      header += '; httponly';
    }

    return header;
  }

}
