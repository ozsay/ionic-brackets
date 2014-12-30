define(function (require, exports, module) {
    "use strict";

    // main init
    var CommandManager      = brackets.getModule("command/CommandManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        DocumentManager 	= brackets.getModule("document/DocumentManager"),
        EditorManager 	    = brackets.getModule("editor/EditorManager"),
        InlineWidget        = brackets.getModule("editor/InlineWidget").InlineWidget,
        Menus               = brackets.getModule("command/Menus"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain          = brackets.getModule("utils/NodeDomain"),
        NativeApp           = brackets.getModule("utils/NativeApp"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        WorkspaceManager    = brackets.getModule("view/WorkspaceManager"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs      = brackets.getModule("widgets/DefaultDialogs"),
        ionicServices       = new NodeDomain("ionic", ExtensionUtils.getModulePath(module, "node/ionicServices")),
        IonicDocs           = require("IonicDocs");
    
    ExtensionUtils.loadStyleSheet(module, "css/ionic-brackets.css");
    
    var IONIC_MENU_ID = "ionic.menu";
    var servePanel;
    var projectPath;
    
    // global functions
    function displayError(title, err, cb) {
        Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERROR, title, err).done(cb);
    }
    
    function toggleServePanel() {
        if (servePanel != null) {
            if (servePanel.isVisible()) servePanel.hide();
            else {
                $('#ionic-serve-frame').attr('src', $('#ionic-serve-frame').attr('src'));
                servePanel.show();
            }
        } else {
            displayError('Live development not started', 'Please select Serve on ionic menu');
        }
    }
    
    function isIonicProject(cb) {
        cb = cb || function () {};
        FileSystem.getDirectoryForPath(ProjectManager.getProjectRoot().fullPath + "/www")
        .exists(function(err, isExists) {
            if (err == null) cb(isExists);
        });
    }
    
    function initializeHook(cb) {
        cb = cb || function () {};
        var hookTemplate = require('text!templates/plugins_hook.js');
        var hooksDir = FileSystem.getDirectoryForPath(projectPath + "/hooks");
        var afterPlatformAddDir = FileSystem.getDirectoryForPath(projectPath + "/hooks/after_platform_add");

        hooksDir.create(function(err) {
            afterPlatformAddDir.create(function(err) {
                FileSystem.getFileForPath(projectPath +            "/hooks/after_platform_add/010_install_plugins.js").write(hookTemplate, function (err) {
                    addPluginsToHook(null, cb);
                });     
            });
        });
    }
    
    function addPluginsToHook(plugin, cb) {
        cb = cb || function () {};
        var hook = FileSystem.getFileForPath(projectPath + "/hooks/after_platform_add/010_install_plugins.js");
        
        hook.read(function(err, data) {
            var start = data.indexOf('[');
            var end = data.indexOf(']') + 1;
            var hookedPlugins = JSON.parse(data.slice(start, end));
            
            if (plugin == null) {
                var pluginsDir = FileSystem.getDirectoryForPath(projectPath + "/plugins");
                
                pluginsDir.getContents(function(err, plugins) {
                    if (err == null) {
                        plugins.forEach(function(installedPlugin) {
                            if (installedPlugin.isDirectory) {
                                hookedPlugins.push(installedPlugin.name);
                            }
                        });
                        
                        data = data.slice(0, start) + JSON.stringify(hookedPlugins) + data.slice(end);

                        hook.write(data, {}, function(err) {
                            cb(err == null);
                        });
                    }
                });
            } else {
                if (hookedPlugins.indexOf(plugin) == -1) {
                    hookedPlugins.push(plugin);
                    data = data.slice(0, start) + JSON.stringify(hookedPlugins) + data.slice(end);

                    hook.write(data, {}, function(err) {
                        cb(err == null);
                    });
                } else  {
                    cb(false);
                }
            }
        });
    }
    
    function hasPluginsHook(cb) {
        cb = cb || function () {};
        FileSystem.getFileForPath(projectPath + "/hooks/after_platform_add/010_install_plugins.js")
        .exists(function(err, isExists) {
            if (err == null) cb(isExists);
        });
    }
    
    function addNgCordova(cb) {
        cb = cb || function () {};
        
        ionicServices.exec("ngCordova")
        .done(function () {
            var mainHtml = FileSystem.getFileForPath(projectPath + "/www/index.html");
            
            mainHtml.read(function(err, data) {
                var start = data.indexOf("<script src=\"cordova.js\"></script>");
                
                data = data.slice(0, start) + "<script src=\"lib/ngCordova/dist/ng-cordova.js\"></script>\n    " + data.slice(start);
                
                mainHtml.write(data, function(err) {
                    var appJs = FileSystem.getFileForPath(projectPath + "/www/js/app.js");

                    appJs.read(function(err, data) {
                        var start = data.indexOf('[', data.search(/^angular.module/)) + 1;

                        data = data.slice(0, start) + "\'ngCordova\'," + data.slice(start);

                        appJs.write(data, function(err) {
                            cb(err == null);
                        });
                    });       
                });
            });
        })
        .fail(function (err) {
            cb(false);
        });        
    }
    
    function hasNgCordova(cb) {
        cb = cb || function () {};
        FileSystem.getFileForPath(projectPath + "/bower.json")
        .read(function(err, data) {
            if (err == null) {
                var bower = JSON.parse(data);
                
                cb(bower.dependencies != null && bower.dependencies.ngCordova != null);
            }
        });
    }
    
    function quickDocsProvider(hostEditor) {
        var currentDoc = DocumentManager.getCurrentDocument();
        var langId = hostEditor.getLanguageForSelection().getId();
        var ionicDoc;
        
        if (langId !== "javascript" && langId !== "html") {
            return null;
        }
        
        var sel = hostEditor.getSelection();
        
        if (sel.start.line !== sel.end.line) {
            return null;
        }
        
        if (sel.start.ch < sel.end.ch) {
            ionicDoc = currentDoc.getLine(sel.start.line).substring(sel.start.ch, sel.end.ch);
        } else if (sel.start.ch > sel.end.ch) {
            ionicDoc = currentDoc.getLine(sel.start.line).substring(sel.end.ch, sel.start.ch);
        } else {
            return null;
        }
        
        return IonicDocs(hostEditor, ionicDoc);
    }
    
    // icon
    var $icon = $("<a>")
        .attr({
            id: 'ionic-icon',
            href: "#",
            class: "icon ion-ionic"
        })
        .css({
            display: "block"
        })
        .click(toggleServePanel)
        .appendTo($("#main-toolbar .buttons"));
    
    // start command
    var startTemplate = require('text!templates/start.html');
    
    function handleIonicStart() {
        var $start = $(startTemplate);
        $start.find("#start-project-name").val(ProjectManager.getProjectRoot().name);
        
        Dialogs.showModalDialogUsingTemplate($start).done(function (status) {
            if (status == "ok") {
                $icon.toggleClass("active");
                var dir = FileSystem.getDirectoryForPath(ProjectManager.getProjectRoot().fullPath + "/tmp");
                
                ionicServices.exec("start", $start.find("#start-project-name").val(),
                                            $start.find("input[name=start-project-template]:checked").val())
                .done(function () {
                   dir.getContents(function (err, contents) {
                       contents.forEach(function(content) {
                           content.rename(ProjectManager.getProjectRoot().fullPath + "/" + content.name);
                       });
                       
                       dir.moveToTrash();
                       
                       if ($start.find("#start-project-plugins").prop('checked')) {
                            initializeHook();
                        }
                       
                       if ($start.find("#start-project-ngCordova").prop('checked')) {
                            addNgCordova();
                        }
                       
                       $icon.toggleClass("active");
                   });
                })
                .fail(function (err) {
                    dir.exists(function(err, exists) {
                        if (exists) {
                            dir.moveToTrash();
                        }
                    });
                    $icon.toggleClass("active");
                });
            }
        });
    }
    
    var START_COMMAND_ID = "ionic.start";
    CommandManager.register("Start an Ionic Project", START_COMMAND_ID, handleIonicStart);
    
    // platform add command
    var platformAddTemplate = require('text!templates/platformAdd.html');
    
    function handleIonicPlatformAdd() {
        var $platformAdd = $(platformAddTemplate);
    
        Dialogs.showModalDialogUsingTemplate($platformAdd).done(function (status) {
            if (status == "ok") {
                $icon.toggleClass("active");
                ionicServices.exec("platformAdd", $platformAdd.find("input[name=platform-add-name]:checked").val())
                .done(function () {
                   $icon.toggleClass("active");
                })
                .fail(function (err) {
                    $icon.toggleClass("active");
                });
            }
        });
    }
    
    var PLATFORM_ADD_COMMAND_ID = "ionic.platformAdd";
    CommandManager.register("Add Platform", PLATFORM_ADD_COMMAND_ID, handleIonicPlatformAdd);
    
    // plugin add command
    var pluginAddTemplate = require('text!templates/pluginAdd.html');
    
    function handleIonicPluginAdd() {
        var $pluginAdd = $(pluginAddTemplate);
        
        hasPluginsHook(function(hasPluginsHook) {
            if (!hasPluginsHook) {
                $pluginAdd.find("#add-plugin-save-label").css({
                    display: "none"
                })
            } else {
                $pluginAdd.find("#add-plugin-save").attr('checked', 'checked');
            }
            
            Dialogs.showModalDialogUsingTemplate($pluginAdd).done(function (status) {
                if (status == "ok") {
                    $icon.toggleClass("active");
                    ionicServices.exec("pluginAdd", $pluginAdd.find("#add-plugin-id").val())
                    .done(function () {
                        if ($pluginAdd.find("#add-plugin-save").prop('checked')) {
                            addPluginsToHook($pluginAdd.find("#add-plugin-id").val(), function (added) {
                                $icon.toggleClass("active");
                            });
                        }
                    })
                    .fail(function (err) {
                        $icon.toggleClass("active");
                    });
                }
            });
        });
    }
    
    var PLUGIN_ADD_COMMAND_ID = "ionic.pluginAdd";
    CommandManager.register("Add Plugin", PLUGIN_ADD_COMMAND_ID, handleIonicPluginAdd);
    
    // build command
    var buildTemplate = require('text!templates/build.html');
    
    function handleIonicBuild() {
        var $build = $(buildTemplate);
        
        Dialogs.showModalDialogUsingTemplate($build).done(function (status) {
            if (status == "ok") {
                $icon.toggleClass("active");
                ionicServices.exec("build", $build.find("input[name=platform-build-name]:checked").val())
                .done(function () {
                   $icon.toggleClass("active");
                })
                .fail(function (err) {
                    $icon.toggleClass("active");
                });
            }
        });
    }
    
    var BUILD_COMMAND_ID = "ionic.build";
    CommandManager.register("Build", BUILD_COMMAND_ID, handleIonicBuild);
    
    // emulate command
    var emulateTemplate = require('text!templates/emulate.html');
    
    function handleIonicEmulate() {
        var $emulate = $(emulateTemplate);
        
        Dialogs.showModalDialogUsingTemplate($emulate).done(function (status) {
            if (status == "ok") {
                $icon.toggleClass("active");
                ionicServices.exec("emulate", $emulate.find("input[name=platform-emulate-name]:checked").val())
                .done(function () {
                   $icon.toggleClass("active");
                })
                .fail(function (err) {
                    $icon.toggleClass("active");
                });
            }
        });
    }
    
    var EMULATE_COMMAND_ID = "ionic.emulate";
    CommandManager.register("Emulate", EMULATE_COMMAND_ID, handleIonicEmulate);
    
    // run command
    var runTemplate = require('text!templates/run.html');
    
    function handleIonicRun() {
        var $run = $(runTemplate);
        
        Dialogs.showModalDialogUsingTemplate($run).done(function (status) {
            if (status == "ok") {
                $icon.toggleClass("active");
                ionicServices.exec("run", $run.find("input[name=platform-run-name]:checked").val())
                .done(function () {
                   $icon.toggleClass("active");
                })
                .fail(function (err) {
                    $icon.toggleClass("active");
                });
            }
        });
    }
    
    var RUN_COMMAND_ID = "ionic.run";
    CommandManager.register("Run", RUN_COMMAND_ID, handleIonicRun);
    
    // serve command
    function handleIonicServe() {
        $icon.toggleClass("active");
        if (servePanel == null) {
            var panelHTML       = "<iframe id=\"ionic-serve-frame\" src=\"http://localhost:8100/ionic-lab\" seamless=\"true\" height=\"100%\" width=\"100%\"></iframe>";
            var $panel = $(panelHTML);
            servePanel = WorkspaceManager.createBottomPanel("ionic-serve-panel", $panel);
        }
        
        ionicServices.exec("serve")
        .done(function () {
           $icon.toggleClass("active");
        })
        .fail(function (err) {
            $icon.toggleClass("active");
        });
    }
    
    var SERVE_COMMAND_ID = "ionic.serve";
    CommandManager.register("Serve", SERVE_COMMAND_ID, handleIonicServe);
    
    // add plugins hook command
    function handleAddPluginsHook() {
        $icon.toggleClass("active");
        hasPluginsHook(function(hasPluginsHook) {
            if (!hasPluginsHook) {
                initializeHook(function() {
                    Menus.getMenu(IONIC_MENU_ID).removeMenuItem(ADD_PLUGINS_HOOK_COMMAND_ID);
                    $icon.toggleClass("active");
                });
            } else {
                $icon.toggleClass("active");
            }
        });
    }
    
    var ADD_PLUGINS_HOOK_COMMAND_ID = "ionic.addPluginsHook";
    CommandManager.register("Add Plugins hook", ADD_PLUGINS_HOOK_COMMAND_ID, handleAddPluginsHook);
    
    // add ng-cordova command
    function handleAddNgCordova() {
        $icon.toggleClass("active");
        addNgCordova(function() {
            Menus.getMenu(IONIC_MENU_ID).removeMenuItem(ADD_NG_CORDOVA_COMMAND_ID);
            $icon.toggleClass("active");
        });
    }
    
    var ADD_NG_CORDOVA_COMMAND_ID = "ionic.addNgCordova";
    CommandManager.register("Add ng-cordova", ADD_NG_CORDOVA_COMMAND_ID, handleAddNgCordova);
    
    // ionic docs command
    function handleIonicDocs() {
        NativeApp.openURLInDefaultBrowser('http://ionicframework.com/docs/');
    }
    
    var IONIC_DOCS_COMMAND_ID = "ionic.ionicDocs";
    CommandManager.register("Go to ionic framework docs", IONIC_DOCS_COMMAND_ID, handleIonicDocs);
    
    // ng-cordova docs command
    function handleNgCordovaDocs() {
        NativeApp.openURLInDefaultBrowser('http://ngcordova.com/docs/');
    }
    
    var NG_CORDOVA_DOCS_COMMAND_ID = "ionic.ngCordovaDocs";
    CommandManager.register("Go to ngCordova docs", NG_CORDOVA_DOCS_COMMAND_ID, handleNgCordovaDocs);
    
    // main events
    ProjectManager.on("projectOpen", function() {
        projectPath = ProjectManager.getProjectRoot().fullPath;
        
        ionicServices.exec("init", ProjectManager.getProjectRoot().fullPath);
        var menu = Menus.addMenu("ionic", IONIC_MENU_ID);
        
        isIonicProject(function(isIonicProject) {
            if (isIonicProject) {
                menu.addMenuItem(PLATFORM_ADD_COMMAND_ID);
                menu.addMenuItem(PLUGIN_ADD_COMMAND_ID);
                menu.addMenuItem(BUILD_COMMAND_ID);
                menu.addMenuItem(EMULATE_COMMAND_ID);
                menu.addMenuItem(RUN_COMMAND_ID);
                menu.addMenuItem(SERVE_COMMAND_ID);
                
                hasPluginsHook(function(hasPluginsHook) {
                    if (!hasPluginsHook) {
                        menu.addMenuItem(ADD_PLUGINS_HOOK_COMMAND_ID);
                    }
                    
                    hasNgCordova(function(hasNgCordova) {
                        if (!hasNgCordova) {
                            menu.addMenuItem(ADD_NG_CORDOVA_COMMAND_ID);
                        }
                        
                        menu.addMenuItem(IONIC_DOCS_COMMAND_ID);
                        menu.addMenuItem(NG_CORDOVA_DOCS_COMMAND_ID);
                    });
                });
            }
            else {
                menu.addMenuItem(START_COMMAND_ID);
            }
        });
    });
    
    ProjectManager.on("projectClose", function() {
        ionicServices.exec("destroy");
        Menus.removeMenu(IONIC_MENU_ID);
        servePanel = null;
    });
    
    ProjectManager.on("beforeAppClose", function() {
        ionicServices.exec("destroy");
    });
    
    EditorManager.registerInlineDocsProvider(quickDocsProvider);
});