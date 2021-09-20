/* eslint-disable @typescript-eslint/ban-ts-comment */
import compare from 'tsscmp'

import crypto, {BinaryToTextEncoding, CipherKey, Encoding} from "crypto";
import {CIPHER_INFO} from "./ciphers";
import type {Partial} from "rollup-plugin-typescript2/dist/partial";

export interface KeyStoreOpts {
  signing?: {
    keys: string[],
    algorithm?: string | 'blake2b512' | 'blake2s256' | 'gost' | 'md4' | 'md5' | 'rmd160' | 'sha1' | 'sha224'
      | 'sha256' | 'sha3-224' | 'sha3-256' | 'sha3-384' | 'sha3-512' | 'sha384' | 'sha512' | 'sha512-224'
      | 'sha512-256' | 'shake128' | 'shake256' | 'sm3';
    encoding?: BinaryToTextEncoding
  },
  encryption?: {
    keys: string[] | CipherKey[],
    algorithm?: keyof typeof CIPHER_INFO | string,
    encoding?: Encoding
    authTagLength?: number
  }
}

type EncryptOptions = Required<KeyStoreOpts['encryption']> & { key?: string | undefined }
type DecryptOptions = Required<KeyStoreOpts['encryption']> & {
  key?: string | CipherKey | undefined,
  iv?: string | Buffer | undefined,
  authTag?: string | Buffer | undefined
}

const AUTH_TAG_REQUIRED = /-(gcm|ccm)/

export class KeyStore {
  encryption: Required<NonNullable<KeyStoreOpts['encryption']>>;
  signing: Required<NonNullable<KeyStoreOpts['signing']>>;

  static cipherInfo = CIPHER_INFO as Record<string | keyof typeof CIPHER_INFO, {
    ivLength: number | undefined,
    keyLength: number
  }>

  constructor(opts?: KeyStoreOpts) {
    opts = opts || {}
    if (opts.encryption) {
      if (!Array.isArray(opts.encryption.keys) || opts.encryption.keys.length === 0) {
        throw new Error("keys are required for encryption")
      }
    }
    if (opts.signing) {
      if (!Array.isArray(opts.signing.keys) || opts.signing.keys.length === 0) {
        throw new Error("keys are required for signing")
      }
    }
    this.encryption = Object.assign({
      algorithm: 'aes-192-ccm',
      authTagLength: 16,
      encoding: 'hex', keys: []
    }, opts.encryption || {} as any)

    this.signing = Object.assign({encoding: 'base64', algorithm: 'sha1', keys: []}, opts.signing || {} as any)

  }

  encrypt(data?: null, options?: Partial<EncryptOptions>): null
  encrypt(data: string | Buffer, options?: Partial<EncryptOptions>): string
  encrypt(data?: string | Buffer | null, options?: Partial<EncryptOptions>): string | null {
    if (!data) {
      return null
    }
    const {
      keys,
      algorithm,
      encoding,
      authTagLength,
      key
    }: EncryptOptions = options ? Object.assign({}, this.encryption, options) : this.encryption

    const secret = key || keys[0]

    if (!secret) {
      throw new Error("no key found")
    }

    const cipherInfo = KeyStore.cipherInfo[algorithm]
    if (!cipherInfo) {
      throw new Error("unsupported cipher")
    }

    const iv = cipherInfo.ivLength ? crypto.randomBytes(cipherInfo.ivLength) : null;
    const dataBuff = typeof data === "string" ? Buffer.from(data, 'utf-8') : data

    const cipher = crypto.createCipheriv(algorithm as any, secret, iv, {authTagLength})

    const text = cipher.update(dataBuff);
    const pad = cipher.final();
    let authTag: Buffer | undefined;
    if (AUTH_TAG_REQUIRED.test(algorithm)) {
      authTag = cipher.getAuthTag();
    }

    return Buffer.concat([
      ...iv ? [iv] : [],
      ...authTag ? [authTag] : [],
      text,
      pad
    ]).toString(encoding)
  }

  decrypt(data?: null, options?: Partial<DecryptOptions>): null
  decrypt(data: string | Buffer, options?: Partial<DecryptOptions>): string
  decrypt(data?: string | Buffer | null, options?: Partial<DecryptOptions>): string | null {
    if (!data) {
      return null
    }

    const finalOptions: DecryptOptions = options ? Object.assign({}, this.encryption, options) : this.encryption

    const {
      encoding,
      key,
      keys: defaultKeys,
      algorithm,
      authTagLength,
    } = finalOptions

    const keys = key ? [ key ] : defaultKeys
    if (keys.length === 0) {
      throw new Error("keys required for encrypted cookies")
    }

    let {
      iv,
      authTag
    } = finalOptions

    let dataBuff = typeof data === "string" ? Buffer.from(data, encoding) : data

    const cipherInfo = KeyStore.cipherInfo[algorithm]
    if (!cipherInfo) {
      throw new Error("unsupported cipher")
    }

    if (typeof iv === "string") {
      iv = Buffer.from(iv, encoding)
    }

    if (typeof authTag === "string") {
      authTag = Buffer.from(authTag, encoding)
    }

    if (!iv) {
      iv = dataBuff.slice(0, cipherInfo.ivLength)
    }
    dataBuff = dataBuff.slice(cipherInfo.ivLength, dataBuff.length)


    if (AUTH_TAG_REQUIRED.test(algorithm)) {
      if (!authTag) {
        authTag = dataBuff.slice(0, authTagLength)
      }
      dataBuff = dataBuff.slice(authTagLength, dataBuff.length)
    }

    for (let i = 0; i < keys.length; i++) {
      const message = KeyStore.doDecrypt(dataBuff, {...finalOptions, key: keys[i], iv, authTag,});
      if (message !== null) return message
    }
    return null
  }

  private static doDecrypt(data: Buffer, options: DecryptOptions): string | null {
    const {algorithm, key, iv, authTagLength, authTag} = options
    const decipher = crypto.createDecipheriv(algorithm as any, key!, iv as Buffer, {authTagLength});

    if (authTag) {
      decipher.setAuthTag(authTag as Buffer)
    }

    const plainText = decipher.update(data)
    try {
      decipher.final()
    } catch {
      // authentication failed
      return null
    }
    return plainText.toString('utf-8')
  }

  //region: signing

  sign(data?: null, key?: string | CipherKey): null
  sign(data: string, key?: string | CipherKey): string
  sign(data?: string | null, key?: string | CipherKey): string | null {
    if (!data) {
      return null
    }
    const {algorithm, encoding, keys} = this.signing
    key = key || keys[0] as CipherKey
    return crypto
      .createHmac(algorithm, key)
      .update(data).digest(encoding)
      .replace(/\/|\+|=/g, function (x) {
        return ({"/": "_", "+": "-", "=": ""})[x] as string
      })
  }

  verify(data: string, digest: string): boolean {
    return this.indexOf(data, digest) > -1
  }

  indexOf(data: string, digest: string): number {
    const {keys} = this.signing

    if (keys.length === 0) {
      throw new Error("keys required for signed cookies")
    }

    for (let i = 0; i < keys.length; i++) {
      if (compare(digest, this.sign(data, keys[i] as string))) return i
    }
    return -1
  }

  //end-region: signing

}

