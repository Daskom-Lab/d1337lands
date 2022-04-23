const bcrypt = require("bcrypt");

export function bcrypt_compare(string, hash) {
  return bcrypt.compareSync(string, hash)
}

export default function bcrypt_hash(string) {
  return bcrypt.hashSync(string, 10)
}