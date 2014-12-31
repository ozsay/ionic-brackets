var gulp = require('gulp');
var git = require('gulp-git');
var copy = require('gulp-copy');
var tap = require('gulp-tap');
var zip = require('gulp-zip');
var Q = require('q');
var del = require('del');

var fs = require('fs');
var path = require('path');

var docs = {
    ngCordovaPlugins: {},
    ionicDocs: {}
};

gulp.task('default', ['completeDocs', 'copyFiles'], function() {
    return gulp.src('dist/**/*')
        .pipe(zip('ionic-brackets.zip'))
        .pipe(gulp.dest('dist'));
})

gulp.task('copyFiles', function() {
    gulp.src('node_modules/marked/lib/marked.js').pipe(gulp.dest('dist/ionic-brackets/lib'));
    gulp.src('bower_components/ionicons/css/ionicons.css').pipe(gulp.dest('dist/ionic-brackets/css'));
    gulp.src('bower_components/ionicons/fonts/*').pipe(gulp.dest('dist/ionic-brackets/fonts'));
    gulp.src(['css/*', 'node/*', 'templates/*', 'IonicDocs.js', 'LICENSE', 'main.js', 'package.json', 'README.md']).pipe(copy('dist/ionic-brackets'));
});

gulp.task('mktmp', function() {
    var deferred = Q.defer();
    
    fs.mkdir("tmp", 777, function(err) {
        if (err) deferred.reject(err);
        deferred.resolve();
    });
    
    return deferred.promise;
});

gulp.task('clean', function (cb) {
    del(['tmp', 'dist'], cb);
});

gulp.task('cloneNgCordova', ['mktmp'], function () {
    var deferred = Q.defer();
    
    git.clone('https://github.com/driftyco/ng-cordova',  {args: '-b gh-pages', cwd: 'tmp'}, function (err) {
        if (err) deferred.reject(err);
        deferred.resolve();
    });
    
    return deferred.promise;
});

gulp.task('prepareNgCordova', ['cloneNgCordova'], function() {
    return gulp.src('tmp/ng-cordova/docs/plugins/*/*')
    .pipe(tap(function(file) {
        if (path.extname(file.path) === '.md') {
            var data = file.contents.toString();
            var start = data.indexOf("---", 5) + 3;
            
            if (start != -1) {
                file.contents = file.contents.slice(start);
                
                var lines = data.split("---")[1].split("\r\n");
                var plugin = {}
                var dir = path.dirname(file.path);
                plugin.path = dir.substring(dir.lastIndexOf(path.sep) + 1);
                
                lines.forEach(function(line) {
                    var line = line.split(": ");
                    
                    if (line.length > 0) {
                        if (line[0] == "plugin-name") {
                            plugin.name = line[1].trim();
                        } else if (line[0] == "source") {
                            plugin.source = line[1];
                        }  else if (line[0] == "official-docs") {
                            plugin.officialDocs = line[1];
                        } else if (line[0] == "icon-apple") {
                            plugin.ios = line[1];
                        } else if (line[0] == "icon-android") {
                            plugin.android = line[1];
                        } 
                    }
                });
                
                docs.ngCordovaPlugins[plugin.name] = plugin;
                }
            }
        }
    ))
    .pipe(gulp.dest('dist/ionic-brackets/docs/ngCordova'));
});

gulp.task('cloneIonicSite', ['mktmp'], function() {
    var deferred = Q.defer();
    
    git.clone('https://github.com/driftyco/ionic-site',  {cwd: 'tmp'}, function (err) {
        if (err) deferred.reject(err);
        deferred.resolve();
    });
    
    return deferred.promise;
});

gulp.task('prepareIonicSite', ['cloneIonicSite'], function() {
    return gulp.src(['tmp/ionic-site/docs/api/object/*/*', 
                     'tmp/ionic-site/docs/api/provider/*/*',
                     'tmp/ionic-site/docs/api/directive/*/*',
                     'tmp/ionic-site/docs/api/service/*/*'])
    .pipe(tap(function(file) {
        if (path.extname(file.path) === '.md') {
            var data = file.contents.toString();

            var lines = data.split("---")[1].split("\r\n");
            var doc = {}
            var dir = path.dirname(file.path);
            doc.path = dir.substring(dir.lastIndexOf(path.sep) + 1);

            lines.forEach(function(line) {
                var line = line.split(": ");

                if (line.length > 0) {
                    if (line[0] == "doc") {
                        doc.title = JSON.parse(line[1].trim());
                    } else if (line[0] == "docType") {
                        doc.type = JSON.parse(line[1]);
                    }
                }
            });

            data = data.substring(data.indexOf('</h1>') + 5).replace(/{% include codepen\.html.+%}/g, "");
            file.contents = new Buffer(data);
            
            docs.ionicDocs[doc.title] = doc;
        }
    }))
    .pipe(gulp.dest('dist/ionic-brackets/docs/ionic'));
});

gulp.task('completeDocs', ['prepareNgCordova', 'prepareIonicSite'], function() {
    del(['tmp']);
    var deferred = Q.defer();
    
    fs.writeFile("dist/ionic-brackets/docs/docs.json", JSON.stringify(docs, null, 4), {}, function(err) {
        if (err) deferred.reject(err);
        deferred.resolve();
    });
    
    return deferred.promise;
});