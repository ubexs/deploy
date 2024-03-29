const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const rimraf = require("rimraf");

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')).toString());
const aws = require('aws-sdk');
const s3 = new aws.S3({
    endpoint: config.aws.endpoint,
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
});
let base = path.join(__dirname, '../../game-client/');
let tmpModuleName = crypto.randomBytes(8).toString('hex');
let dmodule = path.join(__dirname, '../tmp/', tmpModuleName);

fs.mkdirSync(dmodule);
// copy dist/

rimraf.sync(dmodule + './dist/');
// make dist folder if not exists
try {
    fs.readdirSync(dmodule + '/dist')
} catch{
    // does not exist, so make it
    fs.mkdirsSync(dmodule + '/dist/');
}
// copy over config files
fs.copySync(base + '/package.json', dmodule + '/package.json');
fs.copySync(base + '/package-lock.json', dmodule + '/package-lock.json');
fs.copySync(base + '/ecosystem.config.js', dmodule + '/ecosystem.config.js');

// copy over dist dir
fs.copySync(base + './dist/', dmodule + '/dist');
// Obfuscate Dist
const JavaScriptObfuscator = require('javascript-obfuscator');
const walk = function (dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else {
            /* Is a file */
            results.push(file);
        }
    });
    return results;
}
for (const file of walk(dmodule + '/dist')) {
    if (file.slice(file.length - 2) !== 'js') {
        continue;
    }
    // dont obfusucate front-end
    if (file.indexOf('/dist/public/') !== -1) {
        continue;
    }
    // idk why but this file breaks it (not too important anyway so we can just skip it)
    if (file === dmodule + '/dist/models/v1/game.js') {
        continue;
    }
    console.log('Obfuscating ' + file + '...');
    let fileBuff = fs.readFileSync(file);
    let obj = JavaScriptObfuscator.obfuscate(fileBuff.toString(), {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: false,
        debugProtectionInterval: false,
        disableConsoleOutput: false,
        domainLock: [],
        identifierNamesGenerator: 'hexadecimal',
        identifiersDictionary: [],
        identifiersPrefix: '',
        inputFileName: '',
        log: false,
        renameGlobals: false,
        reservedNames: [],
        reservedStrings: [],
        rotateStringArray: true,
        seed: 0,
        selfDefending: false,
        shuffleStringArray: true,
        sourceMap: false,
        sourceMapBaseUrl: '',
        sourceMapFileName: '',
        sourceMapMode: 'separate',
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayEncoding: 'base64',
        stringArrayThreshold: 0.75,
        target: 'node',
        transformObjectKeys: false,
        unicodeEscapeSequence: false
    });
    // console.log(obj.getObfuscatedCode());
    let code = `/* Copyright 2021-${new Date().getFullYear()} ubexs.com - All rights reserved. */\n\n` + obj.getObfuscatedCode();
    fs.writeFileSync(file, code);
}
// add self xss warning
fs.writeFileSync(dmodule + '/dist/public/js/warning.js', `console.log("%cStop!", "color:red; font-size:80px;font-family:sans-serif;");console.log("%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or \\"hack\\", it is a scam and will give them access to your account.", "color:black;font-size:25px;font-family:sans-serif;");`);
let archiveName = path.join(__dirname, '../tmp/', crypto.randomBytes(8).toString('hex') + '.zip');
try {
    var archiver = require('archiver');
    var archive = archiver('zip');
    var out = fs.createWriteStream(archiveName)
    archive.on('error', function (err) {
        throw err;
    });
    archive.pipe(out);
    archive.directory(dmodule, false);
    archive.finalize()
    out.on('close', (e) => {
        s3.putObject({
            Key: 'dist.zip',
            Bucket: 'game-client',
            ACL: 'private',
            Body: fs.createReadStream(archiveName),
        }, (err, ok) => {
            rimraf.sync(dmodule);
            fs.unlinkSync(archiveName);
            if (err) {
                console.error(err);
                process.exit(1);
            } else {
                console.log('dist uploaded');
                process.exit(0);
            }
        })
    });

} catch (e) {
    console.error(e);
    rimraf.sync(dmodule);
    fs.unlinkSync(archiveName);
}
// const d = cp.execSync('dir');
// ok
