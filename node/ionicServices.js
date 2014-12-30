(function () {
    "use strict";
    
    var exec = require('child_process').exec;
    var projectPath;
    var serveCommand;
    var manager;

    function ionicInit(path) {
        projectPath = path;
    }
    
    function ionicDestroy() {
        serveCommand.stdin.end('q\n');
        serveCommand = null;
    }
    
    function runCommand(command, errback) {
        return exec(command, 
            { encoding: 'utf8',
              timeout: 0,
              maxBuffer: 200*1024,
              killSignal: 'SIGTERM',
              cwd: projectPath,
              env: null }, 
            function (error, stdout, stderr) {
                if (error !== null) errback(error.code, false)
                else errback(null, true);
            });
    }
    
    function ionicStart(name, template, errback) {
        runCommand('ionic start -a ' + name + ' tmp ' + template, errback);
    }
    
    function ionicPlatformAdd(name, errback) {
        runCommand('ionic platform add ' + name, errback);
    }
    
    function ionicPluginAdd(id, errback) {
        runCommand('ionic plugin add ' + id, errback).stdout.on('data', function(data){
            console.log(data);
        });
    }
    
    function ionicBuild(name, errback) {
        runCommand('ionic build ' + name, errback);
    }
    
    function ionicEmulate(name, errback) {
        runCommand('ionic emulate ' + name, errback);
    }
    
    function ionicRun(name, errback) {
        runCommand('ionic run ' + name, errback);
    }
    
    function ionicServe(errback) {
        if (serveCommand == null)
            serveCommand = runCommand('ionic serve -b --lab', errback);
    }
    
    function ionicngCordova(errback) {
        runCommand('bower install ngCordova --save', errback);
    }
    
    function init(domainManager) {
        if (!domainManager.hasDomain("ionic")) {
            domainManager.registerDomain("ionic", {major: 0, minor: 1});
        }
        
        domainManager.registerCommand(
            "ionic",
            "init",
            ionicInit,
            false,
            "init ionic project path",
            [
                {
                    name: "path",
                    type: "string",
                    description: "project path"
                }
            ],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "destroy",
            ionicDestroy,
            false,
            "clear resources",
            [],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "start",
            ionicStart,
            true,
            "start an ionic project",
            [
                {
                    name: "name",
                    type: "string",
                    description: "project name"
                },
                {
                    name: "template",
                    type: "string",
                    description: "project template"
                }
            ],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "platformAdd",
            ionicPlatformAdd,
            true,
            "add a plaform",
            [
                {
                    name: "name",
                    type: "string",
                    description: "platform name"
                }
            ],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "pluginAdd",
            ionicPluginAdd,
            true,
            "add a plugin",
            [
                {
                    name: "id",
                    type: "string",
                    description: "plugin id/url"
                }
            ],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "build",
            ionicBuild,
            true,
            "build",
            [
                {
                    name: "name",
                    type: "string",
                    description: "platform name"
                }
            ],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "emulate",
            ionicEmulate,
            true,
            "emulate",
            [
                {
                    name: "name",
                    type: "string",
                    description: "platform name"
                }
            ],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "run",
            ionicRun,
            true,
            "run",
            [
                {
                    name: "name",
                    type: "string",
                    description: "platform name"
                }
            ],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "serve",
            ionicServe,
            true,
            "serve",
            [],
            []
        );
        
        domainManager.registerCommand(
            "ionic",
            "ngCordova",
            ionicngCordova,
            true,
            "install ngCordova",
            [],
            []
        );
    }
    
    exports.init = init;
    
}());