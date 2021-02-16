const fs = require('fs-extra');
const path = require('path');
const s3 = require('../utils/aws');

/**
 * Get a json file and put it somewhere
 * @param {string} folderName web-backend-dist
 * @param {string} s3Bucket web-backend
 * @param {string} s3Key config.json
 */
const main = (folderName, s3Bucket, s3Key) => {
    let fLocation = path.join(__dirname, '../' + folderName + '/config.json');
    s3.getObject({
        Key: s3Key,
        Bucket: s3Bucket,
    }, (err, data) => {
        if (err) {
            return console.error(err);
        }
        let b = data.Body;
        fs.writeFileSync(fLocation, b);
    });
}
module.exports = main;