const bcrypt = require("bcrypt");

export default function bcrypt_hash(string) {
  bcrypt.genSalt(10, function (err, salt) {
    if (err) {
      throw err;
    }

    bcrypt.hash(string, salt, function (err, hashedString) {
      if (err) {
        throw err;
      }

      return hashedString
    });
  });
}
