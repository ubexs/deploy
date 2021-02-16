const fs = require('fs-extra');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')).toString());
const aws = require('aws-sdk');
const s3 = new aws.S3({
    endpoint: config.aws.endpoint,
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
});
let fLocation = path.join(__dirname, '../config/config.game-client.json');
const main = () => {
    let conf = fs.readFileSync(fLocation);
    s3.putObject({
        Key: 'config.json',
        Bucket: 'game-client',
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
main();