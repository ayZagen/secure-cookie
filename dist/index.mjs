/*!
 * secure-cookie v0.0.2
 * (c) Ismail H. Ayaz
 * Released under the MIT License.
 */

import compare from 'tsscmp';
import crypto from 'crypto';
import http from 'http';

// eslint-disable-next-line no-control-regex
var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
var SAME_SITE_REGEXP = /^(?:lax|none|strict)$/i;
var Cookie = /** @class */ (function () {
    function Cookie(name, value, attrs) {
        this.path = '/';
        this.sameSite = false;
        this.secure = false;
        this.httpOnly = true;
        this.overwrite = false;
        if (!fieldContentRegExp.test(name)) {
            throw new TypeError('argument name is invalid');
        }
        if (value && !fieldContentRegExp.test(value)) {
            throw new TypeError('argument value is invalid');
        }
        this.name = name;
        this.value = value || '';
        Object.assign(this, attrs);
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
    Cookie.prototype.toString = function () {
        return this.name + "=" + this.value;
    };
    Object.defineProperty(Cookie.prototype, "header", {
        get: function () {
            var header = this.toString();
            if (this.maxAge) {
                this.expires = new Date(Date.now() + this.maxAge);
            }
            if (this.path) {
                header += "; path=" + this.path;
            }
            if (this.expires) {
                header += "; expires=" + this.expires.toUTCString();
            }
            if (this.domain) {
                header += "; domain=" + this.domain;
            }
            if (this.sameSite) {
                header += "; samesite=" + (this.sameSite === true ? 'strict' : this.sameSite.toLowerCase());
            }
            if (this.secure) {
                header += '; secure';
            }
            if (this.httpOnly) {
                header += '; httponly';
            }
            return header;
        },
        enumerable: false,
        configurable: true
    });
    return Cookie;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArray(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
}

var CIPHER_INFO = {
    'aes-128-cbc': { ivLength: 16, keyLength: 16 },
    'aes-128-cbc-hmac-sha1': { ivLength: 16, keyLength: 16 },
    'aes-128-cbc-hmac-sha256': { ivLength: 16, keyLength: 16 },
    'aes-128-cfb': { ivLength: 16, keyLength: 16 },
    'aes-128-cfb1': { ivLength: 16, keyLength: 16 },
    'aes-128-cfb8': { ivLength: 16, keyLength: 16 },
    'aes-128-ctr': { ivLength: 16, keyLength: 16 },
    'aes-128-ecb': { ivLength: undefined, keyLength: 16 },
    'aes-128-ocb': { ivLength: 12, keyLength: 16 },
    'aes-128-ofb': { ivLength: 16, keyLength: 16 },
    'aes-128-xts': { ivLength: 16, keyLength: 32 },
    'aes-192-cbc': { ivLength: 16, keyLength: 24 },
    'aes-192-cfb': { ivLength: 16, keyLength: 24 },
    'aes-192-cfb1': { ivLength: 16, keyLength: 24 },
    'aes-192-cfb8': { ivLength: 16, keyLength: 24 },
    'aes-192-ctr': { ivLength: 16, keyLength: 24 },
    'aes-192-ecb': { ivLength: undefined, keyLength: 24 },
    'aes-192-ocb': { ivLength: 12, keyLength: 24 },
    'aes-192-ofb': { ivLength: 16, keyLength: 24 },
    'aes-256-cbc': { ivLength: 16, keyLength: 32 },
    'aes-256-cbc-hmac-sha1': { ivLength: 16, keyLength: 32 },
    'aes-256-cbc-hmac-sha256': { ivLength: 16, keyLength: 32 },
    'aes-256-cfb': { ivLength: 16, keyLength: 32 },
    'aes-256-cfb1': { ivLength: 16, keyLength: 32 },
    'aes-256-cfb8': { ivLength: 16, keyLength: 32 },
    'aes-256-ctr': { ivLength: 16, keyLength: 32 },
    'aes-256-ecb': { ivLength: undefined, keyLength: 32 },
    'aes-256-ocb': { ivLength: 12, keyLength: 32 },
    'aes-256-ofb': { ivLength: 16, keyLength: 32 },
    'aes-256-xts': { ivLength: 16, keyLength: 64 },
    'aes-128-ccm': { ivLength: 12, keyLength: 16 },
    'aes-128-gcm': { ivLength: 12, keyLength: 16 },
    'aes-192-ccm': { ivLength: 12, keyLength: 24 },
    'aes-192-gcm': { ivLength: 12, keyLength: 24 },
    'aes-256-ccm': { ivLength: 12, keyLength: 32 },
    'aes-256-gcm': { ivLength: 12, keyLength: 32 },
    'id-aes128-ccm': { ivLength: 12, keyLength: 16 },
    'id-aes128-gcm': { ivLength: 12, keyLength: 16 },
    'id-aes192-ccm': { ivLength: 12, keyLength: 24 },
    'id-aes192-gcm': { ivLength: 12, keyLength: 24 },
    'id-aes256-ccm': { ivLength: 12, keyLength: 32 },
    'id-aes256-gcm': { ivLength: 12, keyLength: 32 },
};

var AUTH_TAG_REQUIRED = /-(gcm|ccm)/;
var KeyStore = /** @class */ (function () {
    function KeyStore(opts) {
        opts = opts || {};
        if (opts.encryption) {
            if (!Array.isArray(opts.encryption.keys) || opts.encryption.keys.length === 0) {
                throw new Error("keys are required for encryption");
            }
        }
        if (opts.signing) {
            if (!Array.isArray(opts.signing.keys) || opts.signing.keys.length === 0) {
                throw new Error("keys are required for signing");
            }
        }
        this.encryption = Object.assign({
            algorithm: 'aes-192-ccm',
            authTagLength: 16,
            encoding: 'hex', keys: []
        }, opts.encryption || {});
        this.signing = Object.assign({ encoding: 'base64', algorithm: 'sha1', keys: [] }, opts.signing || {});
    }
    KeyStore.prototype.encrypt = function (data, options) {
        if (!data) {
            return null;
        }
        var _a = options ? Object.assign({}, this.encryption, options) : this.encryption, keys = _a.keys, algorithm = _a.algorithm, encoding = _a.encoding, authTagLength = _a.authTagLength, key = _a.key;
        var secret = key || keys[0];
        if (!secret) {
            throw new Error("no key found");
        }
        var cipherInfo = KeyStore.cipherInfo[algorithm];
        if (!cipherInfo) {
            throw new Error("unsupported cipher");
        }
        var iv = cipherInfo.ivLength ? crypto.randomBytes(cipherInfo.ivLength) : null;
        var dataBuff = typeof data === "string" ? Buffer.from(data, 'utf-8') : data;
        var cipher = crypto.createCipheriv(algorithm, secret, iv, { authTagLength: authTagLength });
        var text = cipher.update(dataBuff);
        var pad = cipher.final();
        var authTag;
        if (AUTH_TAG_REQUIRED.test(algorithm)) {
            authTag = cipher.getAuthTag();
        }
        return Buffer.concat(__spreadArray(__spreadArray(__spreadArray([], iv ? [iv] : [], true), authTag ? [authTag] : [], true), [
            text,
            pad
        ])).toString(encoding);
    };
    KeyStore.prototype.decrypt = function (data, options) {
        if (!data) {
            return null;
        }
        var finalOptions = options ? Object.assign({}, this.encryption, options) : this.encryption;
        var encoding = finalOptions.encoding, key = finalOptions.key, defaultKeys = finalOptions.keys, algorithm = finalOptions.algorithm, authTagLength = finalOptions.authTagLength;
        var keys = key ? [key] : defaultKeys;
        if (keys.length === 0) {
            throw new Error("keys required for encrypted cookies");
        }
        var iv = finalOptions.iv, authTag = finalOptions.authTag;
        var dataBuff = typeof data === "string" ? Buffer.from(data, encoding) : data;
        var cipherInfo = KeyStore.cipherInfo[algorithm];
        if (!cipherInfo) {
            throw new Error("unsupported cipher");
        }
        if (typeof iv === "string") {
            iv = Buffer.from(iv, encoding);
        }
        if (typeof authTag === "string") {
            authTag = Buffer.from(authTag, encoding);
        }
        if (cipherInfo.ivLength !== undefined) {
            if (!iv) {
                iv = dataBuff.slice(0, cipherInfo.ivLength);
            }
            dataBuff = dataBuff.slice(cipherInfo.ivLength, dataBuff.length);
        }
        if (AUTH_TAG_REQUIRED.test(algorithm)) {
            if (!authTag) {
                authTag = dataBuff.slice(0, authTagLength);
            }
            dataBuff = dataBuff.slice(authTagLength, dataBuff.length);
        }
        for (var i = 0; i < keys.length; i++) {
            var message = KeyStore.doDecrypt(dataBuff, __assign(__assign({}, finalOptions), { key: keys[i], iv: iv, authTag: authTag }));
            if (message !== null)
                return message;
        }
        return null;
    };
    KeyStore.doDecrypt = function (data, options) {
        var algorithm = options.algorithm, key = options.key, iv = options.iv, authTagLength = options.authTagLength, authTag = options.authTag;
        var decipher = crypto.createDecipheriv(algorithm, key, iv || null, { authTagLength: authTagLength });
        if (authTag) {
            decipher.setAuthTag(authTag);
        }
        var plainText = decipher.update(data);
        var final;
        try {
            final = decipher.final();
        }
        catch (e) {
            // authentication failed
            return null;
        }
        return Buffer.concat([plainText, final]).toString('utf-8');
    };
    KeyStore.prototype.sign = function (data, key) {
        if (!data) {
            return null;
        }
        var _a = this.signing, algorithm = _a.algorithm, encoding = _a.encoding, keys = _a.keys;
        key = key || keys[0];
        return crypto
            .createHmac(algorithm, key)
            .update(data).digest(encoding)
            .replace(/\/|\+|=/g, function (x) {
            return ({ "/": "_", "+": "-", "=": "" })[x];
        });
    };
    KeyStore.prototype.verify = function (data, digest) {
        return this.indexOf(data, digest) > -1;
    };
    KeyStore.prototype.indexOf = function (data, digest) {
        var keys = this.signing.keys;
        if (keys.length === 0) {
            throw new Error("keys required for signed cookies");
        }
        for (var i = 0; i < keys.length; i++) {
            if (compare(digest, this.sign(data, keys[i])))
                return i;
        }
        return -1;
    };
    KeyStore.cipherInfo = CIPHER_INFO;
    return KeyStore;
}());

var cache = {};
var Cookies = /** @class */ (function () {
    function Cookies(request, response, options) {
        if (options === void 0) { options = {}; }
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
    Cookies.prototype.get = function (name, opts) {
        var sigId = (opts === null || opts === void 0 ? void 0 : opts.signIdentifier) || this.signIdentifier;
        var sigName = typeof sigId === 'function' ? sigId.call(null, name)
            : "" + (name + '.' + sigId);
        var signed = opts && opts.signed !== undefined ? opts.signed : this.keyStore.signing.keys.length > 0;
        var encrypted = opts && opts.encrypted !== undefined ? opts.encrypted : this.encrypted;
        var header = this.request.headers['cookie'];
        if (!header) {
            return undefined;
        }
        var match = header.match(getPattern(name));
        if (!match) {
            return undefined;
        }
        var value = match[1];
        if (!opts || !signed) {
            return encrypted ? this.keyStore.decrypt(value) : value;
        }
        var remote = this.get(sigName, { encrypted: false, signed: false });
        if (!remote) {
            return undefined;
        }
        var data = name + "=" + value;
        var index = this.keyStore.indexOf(data, remote);
        if (index < 0) {
            this.set(sigName, null, { path: '/', signed: false });
            return undefined;
        }
        else {
            index && this.set(sigName, this.keyStore.sign(data), { signed: false });
            return encrypted ? this.keyStore.decrypt(value) : value;
        }
    };
    /**
     * This sets the given cookie in the response and returns the current context to allow chaining.
     *
     * @param name Cookie name
     * @param value Cookie value. If this is omitted, an outbound header with an expired date is used to delete the cookie.
     * @param opts Overridden options
     */
    Cookies.prototype.set = function (name, value, opts) {
        var res = this.response;
        var req = this.request;
        var headers = (res.getHeader('Set-Cookie') || []);
        var secure = this.secure !== undefined ? !!this.secure : req.protocol === 'https' || req.connection['encrypted'];
        var encrypted = opts && opts.encrypted !== undefined ? opts.encrypted : this.encrypted;
        if (value !== null && encrypted) {
            value = this.keyStore.encrypt(value);
        }
        var cookie = new Cookie(name, value, opts);
        var signed = opts && opts.signed !== undefined ? opts.signed : this.signed;
        /* istanbul ignore next */
        if (typeof headers == 'string') {
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
            var sigId = opts.signIdentifier || this.signIdentifier;
            cookie.name = typeof sigId === 'function' ? sigId.call(null, cookie.name)
                : "" + (cookie.name + '.' + sigId);
            pushCookie(headers, cookie);
        }
        var setHeader = res["set"] ? http.OutgoingMessage.prototype.setHeader : res.setHeader;
        setHeader.call(res, 'Set-Cookie', headers);
        return this;
    };
    Cookies.middleware = function (options) { return function (req, res, next) {
        req.cookies = res.cookies = new Cookies(req, res, options);
        next();
    }; };
    Cookies.connect = Cookies.middleware;
    Cookies.express = Cookies.middleware;
    Cookies.koa = function (options) { return function (ctx, next) {
        ctx.cookies = ctx.req.cookies = ctx.res.cookies = ctx.request.cookies = ctx.response.cookies = new Cookies(ctx.req, ctx.res, options);
        next();
    }; };
    return Cookies;
}());
function getPattern(name) {
    if (cache[name]) {
        return cache[name];
    }
    return cache[name] = new RegExp("(?:^|;) *" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + "=([^;]*)");
}
function pushCookie(headers, cookie) {
    if (cookie.overwrite) {
        for (var i = headers.length - 1; i >= 0; i--) {
            if (headers[i].indexOf(cookie.name + "=") === 0) {
                headers.splice(i, 1);
            }
        }
    }
    headers.push(cookie.header);
}

export { Cookie, Cookies, KeyStore };
//# sourceMappingURL=index.mjs.map
