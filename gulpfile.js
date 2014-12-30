var gulp = require('gulp');
var git = require('gulp-git');
var copy = require('gulp-copy');
var tap = require('gulp-tap');
var zip = require('gulp-zip');
var Q = require('q');
var del = require('del');

var fs = require('fs');
var path = require('path');

var ngCordovaPlugins = {};

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

gulp.task('cloneRepositories', ['mktmp'], function() {
    var deferred = Q.defer();
    
    git.clone('https://github.com/driftyco/ng-cordova',  {args: '-b gh-pages', cwd: 'tmp'}, function (err) {
        if (err) deferred.reject(err);
        deferred.resolve();
    });
    
    return deferred.promise;
});

gulp.task('prepareDocs', ['cloneRepositories'], function() {
    return gulp.src('tmp/ng-cordova/docs/plugins/*/*')
    .pipe(tap(function(file) {
        if (path.extname(file.path) === '.md') {
            var data = file.contents.toString();
            var start = data.indexOf("---", 5) + 3;
            
            if (start != -1) {
                file.contents = file.contents.slice(start);
                
                var lines = data.split("---")[1].split("\r\n");
                var pluginName;
                var plugin = {}
                var dir = path.dirname(file.path);
                plugin.path = dir.substring(dir.lastIndexOf(path.sep) + 1);
                
                lines.forEach(function(line) {
                    var line = line.split(": ");
                    
                    if (line.length > 0) {
                        if (line[0] == "plugin-name") {
                            pluginName = line[1].trim();
                            plugin.name = pluginName;
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
                
                ngCordovaPlugins[pluginName] = plugin;
                }
            }
        }
    ))
    .pipe(gulp.dest('dist/ionic-brackets/docs/ngCordova'));
});

gulp.task('completeDocs', ['prepareDocs'], function() {
    del(['tmp']);
    var deferred = Q.defer();
    
    fs.writeFile("dist/ionic-brackets/docs/ngCordova/plugins.json", JSON.stringify(ngCordovaPlugins, null, 4), {}, function(err) {
        if (err) deferred.reject(err);
        deferred.resolve();
    });
    
    return deferred.promise;
});