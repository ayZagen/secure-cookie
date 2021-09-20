/*!
 * secure-cookie v0.0.0
 * (c) [authorFullName]
 * Released under the MIT License.
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var compare = require('tsscmp');
var crypto = require('crypto');
var http = require('http');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var compare__default = /*#__PURE__*/_interopDefaultLegacy(compare);
var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
var http__default = /*#__PURE__*/_interopDefaultLegacy(http);

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

function __spreadArray(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
}

var KeyStore = /** @class */ (function () {
    function KeyStore(opts) {
        if (opts === void 0) { opts = {}; }
        if (opts.encryption) {
            if (!opts.encryption.keys || opts.encryption.keys.length === 0) {
                throw new Error("keys are required for encryption");
            }
        }
        if (opts.signing) {
            if (!opts.signing.keys || opts.signing.keys.length === 0) {
                throw new Error("keys are required for signing");
            }
        }
        this.encryption = Object.assign({
            ivLength: 64,
            algorithm: 'aes-256-gcm',
            ivSeparator: '|',
            encoding: 'utf-8'
        }, opts.encryption || {});
        this.signing = Object.assign({ encoding: 'utf-8', algorithm: 'sha256' }, opts.signing || {});
    }
    KeyStore.prototype.encrypt = function (data, key) {
        var opts = this.encryption;
        key = key || (opts === null || opts === void 0 ? void 0 : opts.keys[0]);
        if (!key) {
            throw new Error("no key found");
        }
        var iv = crypto__default['default'].randomBytes(opts.ivLength);
        var cipher = crypto__default['default'].createCipheriv(opts.algorithm, key, iv);
        return this.crypt(cipher, data.toString('utf-8'));
    };
    KeyStore.prototype.crypt = function (cipher, data, iv) {
        var _a = this.encryption, encoding = _a.encoding, ivSeparator = _a.ivSeparator;
        var text = cipher.update(data.toString(), encoding);
        var pad = cipher.final();
        return __spreadArray(__spreadArray([], iv ? [iv.toString(encoding), ivSeparator] : [], true), [
            text.toString(encoding),
            pad.toString(encoding)
        ]).join('');
    };
    KeyStore.prototype.decrypt = function (data, key, iv) {
        if (!data) {
            return null;
        }
        var _a = this.encryption, encoding = _a.encoding, ivSeparator = _a.ivSeparator, keys = _a.keys, algorithm = _a.algorithm;
        if (!iv) {
            var dataParts = data.split(ivSeparator);
            if (dataParts.length !== 2 || !dataParts[0] || !dataParts[1]) {
                // TODO: maybe throw ??
                return null;
            }
            iv = dataParts[0];
            data = dataParts[1];
        }
        if (typeof iv === "string") {
            iv = Buffer.from(iv, encoding);
        }
        if (!key) {
            for (var i = 0; i < keys.length; i++) {
                var message = this.decrypt(data, keys[i], iv);
                if (message !== null)
                    return message;
            }
            return null;
        }
        try {
            var cipher = crypto__default['default'].createDecipheriv(algorithm, key, iv);
            return this.crypt(cipher, data);
        }
        catch (err) {
            return null;
        }
    };
    KeyStore.prototype.sign = function (data, key) {
        var _a = this.signing, algorithm = _a.algorithm, encoding = _a.encoding, keys = _a.keys;
        key = key || keys[0];
        return crypto__default['default']
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
        for (var i = 0; i < keys.length; i++) {
            if (compare__default['default'](digest, this.sign(data, keys[i])))
                return i;
        }
        return -1;
    };
    return KeyStore;
}());

var cache = {};
var defaultSignOptions = { identifier: 'sig' };
var Cookies = /** @class */ (function () {
    function Cookies(request, response, options) {
        this.request = request;
        this.response = response;
        if (!(options === null || options === void 0 ? void 0 : options.keyStore)) {
            throw new Error(".keyStore is required");
        }
        this.keyStore = options.keyStore;
        this.secure = options.secure;
        this.signed = options.signed !== undefined ? options.signed : false;
        this.encrypted = options.encrypted !== undefined ? options.encrypted : false;
        this.signOptions = Object.assign(defaultSignOptions, options.signOptions || {});
    }
    Cookies.prototype.get = function (name, opts) {
        var signOptions = Object.assign(this.signOptions, (opts === null || opts === void 0 ? void 0 : opts.signOptions) || {});
        var sigName = typeof (signOptions === null || signOptions === void 0 ? void 0 : signOptions.identifier) === 'function' ?
            signOptions.identifier.call(null, name)
            : "" + (name + '.' + ((signOptions === null || signOptions === void 0 ? void 0 : signOptions.identifier) || 'sig'));
        var signed = opts && opts.signed !== undefined ? opts.signed : !!this.keyStore;
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
        if (!this.keyStore) {
            throw new Error('.keys required for signed cookies');
        }
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
    Cookies.prototype.set = function (name, value, opts) {
        var res = this.response;
        var req = this.request;
        var headers = (res.getHeader('Set-Cookie') || []);
        // @ts-ignore
        var secure = this.secure !== undefined ? !!this.secure : req['protocol'] === 'https' || req.connection['encrypted'];
        var encrypted = opts && opts.encrypted !== undefined ? opts.encrypted : this.encrypted;
        if (value !== null && encrypted) {
            value = this.keyStore.encrypt(value);
        }
        var cookie = new Cookie(name, value, opts);
        var signed = opts && opts.signed !== undefined ? opts.signed : this.signed;
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
            if (!this.keyStore) {
                throw new Error('.keys required for signed cookies');
            }
            cookie.value = this.keyStore.sign(cookie.toString());
            var signOptions = Object.assign(this.signOptions, (opts === null || opts === void 0 ? void 0 : opts.signOptions) || {});
            cookie.name = typeof (signOptions === null || signOptions === void 0 ? void 0 : signOptions.identifier) === 'function' ?
                signOptions.identifier.call(null, cookie.name)
                : "" + (cookie.name + '.' + (signOptions.identifier || 'sig'));
            pushCookie(headers, cookie);
        }
        // @ts-ignore
        var setHeader = res["set"] ? http__default['default'].OutgoingMessage.prototype.setHeader : res.setHeader;
        setHeader.call(res, 'Set-Cookie', headers);
        return this;
    };
    Cookies.middleware = function (keyStore) { return function (req, res, next) {
        req.cookies = res.cookies = new Cookies(req, res, {
            keyStore: keyStore
        });
        next();
    }; };
    Cookies.connect = Cookies.middleware;
    Cookies.express = Cookies.middleware;
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

exports.Cookie = Cookie;
exports.Cookies = Cookies;
exports.KeyStore = KeyStore;
//# sourceMappingURL=index.cjs.map
