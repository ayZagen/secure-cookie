/* eslint-disable @typescript-eslint/ban-ts-comment */
import {KeyStore} from "../src";
import {genRandom} from "./utils";
import crypto from "crypto";
import assert from "assert";

describe('[constructor]', () => {

  it('should accept empty options', () => {
    new KeyStore();
    new KeyStore({})
    // @ts-expect-error
    new KeyStore(null)
  })

  it('should check encryption keys', () => {
    expect(() => {
      // @ts-expect-error
      new KeyStore({encryption: {}})
    }).toThrow(Error)

    expect(() => {
      new KeyStore({encryption: {keys: []}})
    }).toThrow(Error)

    expect(() => {
      // @ts-expect-error
      new KeyStore({encryption: {keys: {}}})
    }).toThrow(Error)
  })

  it('should check signing keys', () => {
    expect(() => {
      // @ts-expect-error
      new KeyStore({signing: {}})
    }).toThrow(Error)

    expect(() => {
      new KeyStore({signing: {keys: []}})
    }).toThrow(Error)

    expect(() => {
      // @ts-expect-error
      new KeyStore({signing: {keys: {}}})
    }).toThrow(Error)
  })

  it('should assign encryption defaults', () => {
    const ks = new KeyStore({encryption: {keys: [genRandom()]}})

    const enc = ks.encryption
    expect(enc).toBeDefined()
    expect(enc.keys).toBeInstanceOf(Array)
    expect(enc.keys).toHaveLength(1)

    expect(typeof enc.encoding).toBe("string")
    expect(typeof enc.algorithm).toBe("string")
  })

  it('should assign signing defaults', () => {
    const ks = new KeyStore({signing: {keys: [genRandom()]}})

    const enc = ks.signing
    expect(enc).toBeDefined()
    expect(enc.keys).toBeInstanceOf(Array)
    expect(enc.keys).toHaveLength(1)

    expect(typeof enc.encoding).toBe("string")
    expect(typeof enc.algorithm).toBe("string")
  })

  it('should override only provided settings', () => {
    const def = new KeyStore()
    const ks = new KeyStore({
      encryption: {
        keys: [genRandom()], encoding: "latin1"
      },
      signing: {
        keys: [genRandom()], algorithm: "sha512"
      }
    })

    expect(ks.encryption.encoding).toEqual("latin1")
    expect(ks.encryption.algorithm).toEqual(def.encryption.algorithm)

    expect(ks.signing.algorithm).toBe("sha512")
    expect(ks.signing.encoding).toBe(def.signing.encoding)
  })
})

describe("encryption", () => {

  describe(".encrypt", () => {

    it("should work", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          algorithm: "aes-192-ccm",
          encoding: "hex",
          authTagLength: 16
        }
      })
      jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => Buffer.from("123412341234", "utf-8"))
      const encrypted = ks.encrypt("ohmytext")
      expect(encrypted).toBe("313233343132333431323334d0658e97af34ad7906a0724657faee5c062a9b5842925dc0".toLowerCase())
    })

    it("should work w/ buffer", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          algorithm: "aes-192-ccm",
          encoding: "hex",
          authTagLength: 16
        }
      })
      jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => Buffer.from("123412341234", "utf-8"))
      const encrypted = ks.encrypt(Buffer.from("ohmytext", "utf-8"))
      expect(encrypted).toBe("313233343132333431323334d0658e97af34ad7906a0724657faee5c062a9b5842925dc0".toLowerCase())
    })

    it('should return null if data is not defined', function () {
      const ks = new KeyStore({
        encryption: {keys: [genRandom(24)]}
      })
      expect(ks.encrypt()).toBe(null)
    });

    it("should fail if no key exists to encrypt", () => {
      const ks = new KeyStore({
        encryption: {keys: [genRandom(24)]}
      })
      ks.encryption.keys = []
      expect(() => {
        ks.encrypt("ohmytext")
      }).toThrow(Error)
    })

    it("should fail if unsupported cipher provided", () => {
      const ks = new KeyStore({
        encryption: {
          keys: [genRandom(24)],
        }
      })
      expect(() => {
        ks.encrypt("ohmytext", {
          algorithm: "some-algorithm-unsupported"
        })
      }).toThrow(Error)
    })

    it("should allow using different secret key", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          algorithm: "aes-192-cbc",
          encoding: "hex"
        }
      })
      jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => Buffer.from("1234123412341234", "utf-8"))
      const encrypted = ks.encrypt("ohmytext", {key: "necretnecretnecretnecret"})
      expect(encrypted).toBe("3132333431323334313233343132333459c8afb0dac2e2ad875c39ce614ad418".toLowerCase())
    })

    it("should allow using different encoding", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["32secretsecretsecretsecretsecret"],
          algorithm: "aes-256-cbc",
          encoding: "base64"
        }
      })
      jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => Buffer.from("1234123412341234", "utf-8"))
      const encrypted = ks.encrypt("ohmytext")
      expect(encrypted).toBe("MTIzNDEyMzQxMjM0MTIzNOYHxZR3iT5J166DoLYrYQc=")
    })

    it("should allow providing custom options", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["32secretsecretsecretsecretsecret"],
          algorithm: "aes-192-cbc",
          encoding: "hex"
        }
      })
      jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => Buffer.from("1234123412341234", "utf-8"))
      const encrypted = ks.encrypt("ohmytext", {
        encoding: "base64",
        algorithm: "aes-256-cbc",
      })
      expect(encrypted).toBe("MTIzNDEyMzQxMjM0MTIzNOYHxZR3iT5J166DoLYrYQc=")
    })

    it("should allow algorithms without iv", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["32secretsecretsecretsecretsecret"],
          algorithm: "aes-256-ecb",
          encoding: "base64"
        }
      })
      const encrypted = ks.encrypt("ohmytext")
      expect(encrypted).toBe("43ZmN7YJ/wWv5ivQW8M6Uw==")
    })
  })


  describe('.decrypt', () => {

    it("should work", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          encoding: "base64"
        }
      })

      const encrypted = ks.encrypt("ohmytext")

      const decrypted = ks.decrypt(encrypted)
      expect(decrypted).toBe("ohmytext")
    })

    it("should work w/ buffer", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          encoding: "base64"
        }
      })
      const encrypted = ks.encrypt("ohmytext")

      const decrypted = ks.decrypt(Buffer.from(encrypted, "base64"))
      expect(decrypted).toBe("ohmytext")
    })

    it('should return null if auth fails', function () {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          encoding: "base64"
        }
      })
      const encrypted = ks.encrypt("ohmytext")
      const decrypted = ks.decrypt(encrypted, { authTag: Buffer.from("1234567812345678", "utf-8")})
      expect(decrypted).toBe(null)
    });

    it("should fail if no key exists to decrypt with", () => {
      const ks = new KeyStore({
        encryption: {keys: [genRandom(24)]}
      })
      ks.encryption.keys = []
      expect(() => {
        ks.decrypt("ohmytext")
      }).toThrow(Error)
    })

    it("should accept iv buffer", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          algorithm: "aes-192-ccm",
          encoding: "hex",
          authTagLength: 16
        }
      })
      expect(ks.decrypt("313233343132333431323334d0658e97af34ad7906a0724657faee5c062a9b5842925dc0", {
        iv: Buffer.from("123412341234", "utf-8")
      })).toBe("ohmytext")
    })

    it("should accept iv string", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          algorithm: "aes-192-ccm",
          encoding: "hex",
          authTagLength: 16
        }
      })
      expect(ks.decrypt("313233343132333431323334d0658e97af34ad7906a0724657faee5c062a9b5842925dc0", {
        iv: "313233343132333431323334"
      })).toBe("ohmytext")
    })

    it("should accept authTag buffer", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          algorithm: "aes-192-ccm",
          encoding: "hex",
          authTagLength: 16
        }
      })
      expect(ks.decrypt("313233343132333431323334d0658e97af34ad7906a0724657faee5c062a9b5842925dc0", {
        authTag: Buffer.from("d0658e97af34ad7906a0724657faee5c", "hex")
      })).toBe("ohmytext")
    })

    it("should accept authTag string", () => {
      const ks = new KeyStore({
        encryption: {
          keys: ["secretsecretsecretsecret"],
          algorithm: "aes-192-ccm",
          encoding: "hex",
          authTagLength: 16
        }
      })
      expect(ks.decrypt("313233343132333431323334d0658e97af34ad7906a0724657faee5c062a9b5842925dc0", {
        authTag: "d0658e97af34ad7906a0724657faee5c"
      })).toBe("ohmytext")
    })

    it("should return null if no data provided", () => {
      const ks = new KeyStore({
        encryption: {keys: [genRandom(24)]}
      })
      expect(ks.decrypt()).toBe(null)
    })

    it("should fail if unsupported cipher provided", () => {
      const ks = new KeyStore({
        encryption: {keys: [genRandom(24)]}
      })
      expect(() => {
        ks.decrypt("doesnotmatter", {algorithm: "some-algorithm-unsupported"})
      }).toThrow(Error)
    })

    it("should work with different authTagLength", () => {
      const ks = new KeyStore({
        encryption: {
          authTagLength: 10,
          keys: [genRandom(24)]
        }
      })

      const encrypted = ks.encrypt("ohmytext")

      const decrypted = ks.decrypt(encrypted)
      expect(decrypted).toBe("ohmytext")
    })

  })
})

describe("signing", () => {

  describe('.indexOf(data)', function () {
    it('should w/ no keys', function () {
      const ks = new KeyStore({
        encryption: {keys: [genRandom(24)]}
      })
      ks.encryption.keys = []
      expect(() => {
        ks.indexOf("ohmytext", "ohmytext")
      }).toThrow(Error)
    });

    it('should return key index that signed data', function () {
      const keys = new KeyStore({signing: {keys: ['SEKRIT2', 'SEKRIT1']}})
      const data = 'Keyboard Cat has a hat.'

      assert.strictEqual(keys.indexOf(data, '_jl9qXYgk5AgBiKFOPYK073FMEQ'), 0)
      assert.strictEqual(keys.indexOf(data, '34Sr3OIsheUYWKL5_w--zJsdSNk'), 1)
    })

    it('should return -1 when no key matches', function () {
      const keys = new KeyStore({signing: {keys: ['SEKRIT2', 'SEKRIT1']}})
      const data = 'Keyboard Cat has a hat.'

      assert.strictEqual(keys.indexOf(data, 'xmM8HQl2eBtPP9nmZ7BK_wpqoxQ'), -1)
    })

    describe('with "algorithm"', function () {
      it('should return key index using algorithm', function () {
        const keys = new KeyStore({signing: {keys: ['SEKRIT1'], algorithm: 'sha256'}})
        const data = 'Keyboard Cat has a hat.'

        assert.strictEqual(keys.indexOf(data, 'pu97aPRZRLKi3-eANtIlTG_CwSc39mAcIZ1c6FxsGCk'), 0)
      })
    })

    describe('with "encoding"', function () {
      it('should return key index using encoding', function () {
        const keys = new KeyStore({signing: {keys: ['SEKRIT1'], encoding: 'hex'}})
        const data = 'Keyboard Cat has a hat.'

        assert.strictEqual(keys.indexOf(data, 'df84abdce22c85e51858a2f9ff0fbecc9b1d48d9'), 0)
      })
    })
  })

  describe('.sign(data)', function () {
    it('should sign a string', function () {
      const keys = new KeyStore({signing: {keys: ['SEKRIT1']}})
      const hash = keys.sign('Keyboard Cat has a hat.')

      assert.strictEqual(hash, '34Sr3OIsheUYWKL5_w--zJsdSNk')
    })
    it('should return null if data is not provided', function () {
      const keys = new KeyStore({signing: {keys: ['SEKRIT1']}})
      assert.strictEqual(keys.sign(), null)
    })

    it('should sign with first secret', function () {
      const keys = new KeyStore({signing: {keys: ['SEKRIT2', 'SEKRIT1']}})
      const hash = keys.sign('Keyboard Cat has a hat.')

      assert.strictEqual(hash, '_jl9qXYgk5AgBiKFOPYK073FMEQ')
    })

    describe('with "algorithm"', function () {
      it('should return signature using algorithm', function () {
        const keys = new KeyStore({signing: {keys: ['SEKRIT1'], algorithm: 'sha256'}})
        const hash = keys.sign('Keyboard Cat has a hat.')

        assert.strictEqual(hash, 'pu97aPRZRLKi3-eANtIlTG_CwSc39mAcIZ1c6FxsGCk')
      })
    })

    describe('with "encoding"', function () {
      it('should return signature in encoding', function () {
        const keys = new KeyStore({signing: {keys: ['SEKRIT1'], encoding: 'hex'}})
        const hash = keys.sign('Keyboard Cat has a hat.')

        assert.strictEqual(hash, 'df84abdce22c85e51858a2f9ff0fbecc9b1d48d9')
      })
    })
  })

  describe('.verify(data)', function () {
    it('should validate against any key', function () {
      const keys = new KeyStore({signing: {keys: ['SEKRIT2', 'SEKRIT1']}})
      const data = 'Keyboard Cat has a hat.'

      assert.ok(keys.verify(data, '_jl9qXYgk5AgBiKFOPYK073FMEQ'))
      assert.ok(keys.verify(data, '34Sr3OIsheUYWKL5_w--zJsdSNk'))
    })

    it('should fail with bogus data', function () {
      const keys = new KeyStore({signing: {keys: ['SEKRIT2', 'SEKRIT1']}})
      const data = 'Keyboard Cat has a hat.'

      assert.ok(!keys.verify(data, 'bogus data'))
    })

    it('should fail when key not present', function () {
      const keys = new KeyStore({signing: {keys: ['SEKRIT2', 'SEKRIT1']}})
      const data = 'Keyboard Cat has a hat.'

      assert.ok(!keys.verify(data, 'xmM8HQl2eBtPP9nmZ7BK_wpqoxQ'))
    })

    describe('with "algorithm"', function () {
      it('should validate using algorithm', function () {
        const keys = new KeyStore({signing: {keys: ['SEKRIT1'], algorithm: 'sha256'}})
        const data = 'Keyboard Cat has a hat.'

        assert.ok(keys.verify(data, 'pu97aPRZRLKi3-eANtIlTG_CwSc39mAcIZ1c6FxsGCk'))
      })
    })

    describe('with "encoding"', function () {
      it('should validate using encoding', function () {
        const keys = new KeyStore({signing: {keys: ['SEKRIT1'], encoding: 'hex'}})
        const data = 'Keyboard Cat has a hat.'

        assert.ok(keys.verify(data, 'df84abdce22c85e51858a2f9ff0fbecc9b1d48d9'))
      })
    })
  })
})
