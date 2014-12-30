#!/usr/bin/env node

var pluginlist = [
];

var exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    console.log(stdout);
}

pluginlist.forEach(function(plug) {
    exec("cordova plugin add " + plug, puts);
});
