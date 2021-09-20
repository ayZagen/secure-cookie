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
- [signOptions](Cookies.md#signoptions)
- [signed](Cookies.md#signed)
- [connect](Cookies.md#connect)
- [express](Cookies.md#express)

### Methods

- [get](Cookies.md#get)
- [set](Cookies.md#set)
- [middleware](Cookies.md#middleware)

## Constructors

### constructor

• **new Cookies**(`request`, `response`, `options`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `IncomingMessage` \| `Http2ServerRequest` |
| `response` | `ServerResponse` \| `Http2ServerResponse` |
| `options` | [`CookiesOptions`](../README.md#cookiesoptions) |

#### Defined in

cookies.ts:45

## Properties

### encrypted

• **encrypted**: `boolean`

Encrypt cookies by default and assume received cookies are encrypted.

#### Defined in

cookies.ts:35

___

### keyStore

• **keyStore**: `KeyStore`

#### Defined in

cookies.ts:44

___

### request

• **request**: `IncomingMessage` \| `Http2ServerRequest`

#### Defined in

cookies.ts:41

___

### response

• **response**: `ServerResponse` \| `Http2ServerResponse`

#### Defined in

cookies.ts:42

___

### secure

• `Optional` **secure**: `boolean`

Mark cookies as secure by default.

#### Defined in

cookies.ts:30

___

### signOptions

• `Optional` **signOptions**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `identifier` | `string` \| (`name`: `string`) => `string` | If string, provided value will be appended cookie name with dot. For example with given value `mysig` signature cookie name will be `cookiename.mysig`  **`default`** 'sig' |

#### Defined in

cookies.ts:43

___

### signed

• **signed**: `boolean`

Sign cookies by default and assume received cookies are signed

#### Defined in

cookies.ts:40

___

### connect

▪ `Static` **connect**: (`keyStore`: `KeyStore`) => (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

#### Type declaration

▸ (`keyStore`): (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `keyStore` | `KeyStore` |

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

cookies.ts:155

___

### express

▪ `Static` **express**: (`keyStore`: `KeyStore`) => (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

#### Type declaration

▸ (`keyStore`): (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `keyStore` | `KeyStore` |

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

cookies.ts:156

## Methods

### get

▸ **get**(`name`, `opts?`): `undefined` \| ``null`` \| `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `opts?` | [`CookiesOptions`](../README.md#cookiesoptions) |

#### Returns

`undefined` \| ``null`` \| `string`

#### Defined in

cookies.ts:59

___

### set

▸ **set**(`name`, `value`, `opts`): [`Cookies`](Cookies.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `value` | ``null`` \| `string` |
| `opts` | [`CookiesOptions`](../README.md#cookiesoptions) & `CookieAttrs` |

#### Returns

[`Cookies`](Cookies.md)

#### Defined in

cookies.ts:103

___

### middleware

▸ `Static` **middleware**(`keyStore`): (`req`: `any`, `res`: `any`, `next`: `any`) => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `keyStore` | `KeyStore` |

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

cookies.ts:148
