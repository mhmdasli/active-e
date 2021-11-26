const crypto = require("crypto");
const logger = require("./helpers").logger();
const { Env } = require("./env");

class Encryptor {

    constructor() {
        this.algorithm = "aes-256-cbc";
        this.initVector = new Buffer.alloc(16, Env.select("ENCRYPTION_KEY"));
        this.securitykey = new Buffer.alloc(32, Env.select("ENCRYPTION_KEY"));
    }

    encrypt(buff) {
        const cipher = crypto.createCipheriv(this.algorithm, this.securitykey, this.initVector);
        let encryptedData = cipher.update(buff);
        encryptedData = Buffer.concat([encryptedData, cipher.final()]);
        return encryptedData;
    }

    decrypt(buff) {
        const decipher = crypto.createDecipheriv(this.algorithm, this.securitykey, this.initVector);
        let decryptedData = decipher.update(buff);
        decryptedData = Buffer.concat([decryptedData, decipher.final()]);
        return decryptedData;
    }

}
module.exports = {Encryptor}