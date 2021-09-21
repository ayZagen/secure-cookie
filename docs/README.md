secure-cookie

# secure-cookie

## Table of contents

### Classes

- [Cookies](classes/Cookies.md)

### Type aliases

- [CookiesOptions](README.md#cookiesoptions)
- [GetCookieOptions](README.md#getcookieoptions)
- [SetCookieOptions](README.md#setcookieoptions)

## Type aliases

### CookiesOptions

Ƭ **CookiesOptions**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `encrypted?` | `boolean` | Encrypt cookies by default and assume received cookies are encrypted.  **`default`** false |
| `keyStore?` | `KeyStore` | KeyStore to be used for signing and encrypting |
| `secure?` | `boolean` | Mark cookies as secure by default.  **`default`** `req.protocol` |
| `signIdentifier?` | `SignIdentifier` | If string, provided value will be appended cookie name with dot. For example with given value `mysig` signature cookie name will be `cookiename.mysig`  **`default`** `sig` |
| `signed?` | `boolean` | a boolean indicating whether the cookie is to be signed (`false` by default). If this is true, another cookie of the same name with the `signIdentifier` will also be sent, with a 27-byte url-safe base64 SHA1 value representing the hash of _cookie-name_=_cookie-value_ against the first [KeyStore](keystore) key. This signature key is used to detect tampering the next time a cookie is received.  **`default`** false |

#### Defined in

[cookies.ts:8](https://github.com/ayZagen/secure-cookie/blob/e57275f/src/cookies.ts#L8)

___

### GetCookieOptions

Ƭ **GetCookieOptions**: [`CookiesOptions`](README.md#cookiesoptions)

#### Defined in

[cookies.ts:39](https://github.com/ayZagen/secure-cookie/blob/e57275f/src/cookies.ts#L39)

___

### SetCookieOptions

Ƭ **SetCookieOptions**: [`CookiesOptions`](README.md#cookiesoptions) & `CookieAttrs`

#### Defined in

[cookies.ts:38](https://github.com/ayZagen/secure-cookie/blob/e57275f/src/cookies.ts#L38)
