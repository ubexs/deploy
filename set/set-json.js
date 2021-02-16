const fs = require('fs-extra');
const path = require('path');
const s3 = require('../utils/aws');

/**
 * Upload a config file to aws
 * @param {string} s3Bucket web-backend
 * @param {string} s3Key config.json
 */
const main = (s3Bucket, s3Key) => {
    let fLocation = path.join(__dirname, '../config/config.' + s3Bucket + '.json');

    let conf = fs.readFileSync(fLocation);
    s3.putObject({
        Key: s3Key,
        Bucket: s3Bucket,
        Body: conf,
        ACL: 'private',
    }, (err, data) => {
        if (err) {
            return console.error(err);
        } else {
            console.log('config uploaded.');
        }
    });
}
module.exports = main;