[secure-cookie](../README.md) / Cookies

# Class: Cookies

## Table of contents

### Constructors

- [constructor](Cookies.md#constructor)

### Properties

- [encrypted](Cookies.md#encrypted)
- [keyStore](Cookies.md#keystore)
- [request](Cookies.md#request)
- [response](Cookies.md#response)
- [secure](Cookies.md#secure)
- [signIdentifier](Cookies.md#signidentifier)
- [signed](Cookies.md#signed)
- [connect](Cookies.md#connect)
- [express](Cookies.md#express)

### Methods

- [get](Cookies.md#get)
- [set](Cookies.md#set)
- [koa](Cookies.md#koa)
- [middleware](Cookies.md#middleware)

## Constructors

### constructor

• **new Cookies**(`request`, `response`, `options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `IncomingMessage` \| `Http2ServerRequest` |
| `response` | `ServerResponse` \| `Http2ServerResponse` |
| `options` | [`CookiesOptions`](../README.md#cookiesoptions) |

#### Defined in

[cookies.ts:56](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L56)

## Properties

### encrypted

• **encrypted**: `boolean`

#### Defined in

[cookies.ts:45](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L45)

___

### keyStore

• **keyStore**: `KeyStore`

#### Defined in

[cookies.ts:49](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L49)

___

### request

• `Readonly` **request**: `IncomingMessage` \| `Http2ServerRequest`

#### Defined in

[cookies.ts:53](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L53)

___

### response

• `Readonly` **response**: `ServerResponse` \| `Http2ServerResponse`

#### Defined in

[cookies.ts:54](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L54)

___

### secure

• **secure**: `undefined` \| `boolean`

#### Defined in

[cookies.ts:43](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L43)

___

### signIdentifier

• `Optional` **signIdentifier**: `SignIdentifier`

#### Defined in

[cookies.ts:51](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L51)

___

### signed

• **signed**: `boolean`

#### Defined in

[cookies.ts:47](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L47)

___

### connect

▪ `Static` **connect**: (`options?`: [`CookiesOptions`](../README.md#cookiesoptions)) => (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

#### Type declaration

▸ (`options?`): (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | [`CookiesOptions`](../README.md#cookiesoptions) |

##### Returns

`fn`

▸ (`req`, `res`, `next`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `any` |
| `res` | `any` |
| `next` | `any` |

##### Returns

`void`

#### Defined in

[cookies.ts:183](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L183)

___

### express

▪ `Static` **express**: (`options?`: [`CookiesOptions`](../README.md#cookiesoptions)) => (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

#### Type declaration

▸ (`options?`): (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | [`CookiesOptions`](../README.md#cookiesoptions) |

##### Returns

`fn`

▸ (`req`, `res`, `next`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `any` |
| `res` | `any` |
| `next` | `any` |

##### Returns

`void`

#### Defined in

[cookies.ts:184](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L184)

## Methods

### get

▸ **get**(`name`, `opts?`): `undefined` \| `string`

This extracts the cookie with the given name from the Set-Cookie header in the request. If such a cookie exists, its value is returned. Otherwise, nothing is returned.

`{ signed: true }` can optionally be passed as the second parameter options. In this case, a signature cookie (a cookie of same name ending with the .sig suffix appended) is fetched. If no such cookie exists, nothing is returned.

If the signature cookie does exist, the provided KeyStore is used to check whether the hash of cookie-name=cookie-value matches that of any registered key/s:

- If the signature cookie hash matches the first key, the original cookie value is returned.
- If the signature cookie hash matches any other key, the original cookie value is returned AND an outbound header is set to update the signature cookie's value to the hash of the first key. This enables automatic freshening of signature cookies that have become stale due to key rotation.
- If the signature cookie hash does not match any key, nothing is returned, and an outbound header with an expired date is used to delete the cookie.

`{ encrypted: true }` can optionally be passed as the second parameter options. In this case, the provided KeyStore will try to decrypt the cookie value with registered key/s.

- If the decryption fails nothing is returned, and the cookie stays intact.
- If decryption succeeds, decrypted cookie value is returned.

If both `signed` and `encrypted` options are provided, signature check will be applied with encrypted value. Than the decryption will be applied.

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `opts?` | [`CookiesOptions`](../README.md#cookiesoptions) |

#### Returns

`undefined` \| `string`

#### Defined in

[cookies.ts:87](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L87)

___

### set

▸ **set**(`name`, `value?`, `opts?`): [`Cookies`](Cookies.md)

This sets the given cookie in the response and returns the current context to allow chaining.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | Cookie name |
| `value?` | ``null`` \| `string` | Cookie value. If this is omitted, an outbound header with an expired date is used to delete the cookie. |
| `opts?` | [`SetCookieOptions`](../README.md#setcookieoptions) | Overridden options |

#### Returns

[`Cookies`](Cookies.md)

#### Defined in

[cookies.ts:136](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L136)

___

### koa

▸ `Static` **koa**(`options?`): (`ctx`: `any`, `next`: `any`) => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | [`CookiesOptions`](../README.md#cookiesoptions) |

#### Returns

`fn`

▸ (`ctx`, `next`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `any` |
| `next` | `any` |

##### Returns

`void`

#### Defined in

[cookies.ts:185](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L185)

___

### middleware

▸ `Static` **middleware**(`options?`): (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | [`CookiesOptions`](../README.md#cookiesoptions) |

#### Returns

`fn`

▸ (`req`, `res`, `next`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `any` |
| `res` | `any` |
| `next` | `any` |

##### Returns

`void`

#### Defined in

[cookies.ts:178](https://github.com/ayZagen/secure-cookie/blob/1fa5a27/src/cookies.ts#L178)
