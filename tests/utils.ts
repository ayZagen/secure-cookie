import crypto from "crypto";

export function genRandom(length = 32){
  return crypto.randomBytes(length / 2).toString("hex")
}
