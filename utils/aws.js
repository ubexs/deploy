const fs = require('fs-extra');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')).toString());
const aws = require('aws-sdk');
const s3 = new aws.S3({
    endpoint: config.aws.endpoint,
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
});
module.exports = s3;