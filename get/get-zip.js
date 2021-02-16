const fs = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const crypto = require('crypto');
const cp = require('child_process');
const unzipper = require('unzipper');
const s3 = require('../utils/aws');

let zipLocation = path.join(__dirname, '../tmp/', crypto.randomBytes(8).toString('hex') + '.zip');

/**
 * Get a zip archive and extract it
 * @param {string} folderName web-backend-dist
 * @param {string} s3Bucket web-backend
 * @param {string} s3Key dist.zip
 */
const main = (folderName, s3Bucket, s3Key) => {
    let distPath = path.join(__dirname, '../' + folderName);
    if (fs.existsSync(distPath)) {
        rimraf.sync(distPath);
    }
    fs.mkdirSync(distPath);
    let data = s3.getObject({
        Key: s3Key,
        Bucket: s3Bucket,
    });

    let d = data.createReadStream()
    let zip = fs.createWriteStream(zipLocation)
    zip.on('close', () => {
        let distPath = path.join(__dirname, '../' + folderName + '/');
        console.log('read done. unzipping');
        fs.createReadStream(zipLocation).pipe(unzipper.Extract({ path: distPath })).on('close', () => {
            console.log('done unzip');
            fs.removeSync(zipLocation);

            let join = ';';
            if (process.platform === 'win32') {
                join = '&&';
            }
            cp.execSync(`cd ${distPath} ${join} npm install`);
        })
    })
    d.pipe(zip)
    console.log('piped');
}
module.exports = main;