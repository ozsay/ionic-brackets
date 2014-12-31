define(function (require, exports, module) {
    "use strict";
    
    var InlineWidget    = brackets.getModule("editor/InlineWidget").InlineWidget,
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        template        = require('text!templates/IonicDocs.html'),
        docs            = JSON.parse(require('text!docs/docs.json')),
        marked          = require("lib/marked"),
        docsPath        = ExtensionUtils.getModulePath(module) + "docs/";
    
    ExtensionUtils.loadStyleSheet(module, "css/ionic-brackets.css");
    ExtensionUtils.loadStyleSheet(module, "css/ionicons.css");
    
    function createNgCordovaDoc(hostEditor, doc) {
        var deferred = new $.Deferred();
        
        if (doc.html != null) {
            deferred.resolve(new IonicDocs(hostEditor, doc));
        } else {
            FileSystem.getFileForPath(docsPath + "ngCordova/" + doc.path + "/index.md")
            .read(function(err, data) {
                if (err == null) {
                    var renderer = new marked.Renderer();
                    renderer._image = renderer.image;
                    renderer.image = function(href, title, text) {
                        href = docsPath + "ngCordova/" + doc.path + "/" + href;
                        return renderer._image(href, title, text);
                    };

                    doc.html = $(template);
                    $(marked(data, { renderer: renderer })).appendTo(doc.html.find(".scrollable"));

                    var bar = doc.html.find("#ionic-docs-bar");

                    if (doc.ios == "true") 
                        $("<i>").attr({class: "icon ion-social-apple ionic-docs-icon"}).appendTo(bar);
                    if (doc.android == "true") 
                        $("<i>").attr({class: "icon ion-social-android ionic-docs-icon"}).appendTo(bar);

                    $("<a>").attr({href: doc.source, class: "btn"}).text('Source').appendTo(bar);
                    $("<a>").attr({href: doc.officialDocs, class: "btn"}).text('Official Docs').appendTo(bar);

                    doc.html.find("#ionic-docs-title").html(doc.name);

                    deferred.resolve(new IonicDocs(hostEditor, doc));
                } else {
                    deferred.reject();
                }
            });
        }
        
        return deferred.promise();
    }
    
    function createIonicFrameworkDoc(hostEditor, doc) {
        var deferred = new $.Deferred();
        
        if (doc.html != null) {
            deferred.resolve(new IonicDocs(hostEditor, doc));
        } else {
            FileSystem.getFileForPath(docsPath + "ionic/" + doc.path + "/index.md")
            .read(function(err, data) {
                if (err == null) {
                    doc.html = $(template);
                    $(marked(data)).appendTo(doc.html.find(".scrollable"));

                    doc.html.find("#ionic-docs-title").html("<small>" + doc.type + "</small> " + doc.title);

                    deferred.resolve(new IonicDocs(hostEditor, doc));
                } else {
                    deferred.reject();
                }
            });
        }
        
        return deferred.promise();
    }
    
    function createIonicDoc(hostEditor, possibleDocId) {
        if (docs.ngCordovaPlugins[possibleDocId] != null) 
            return createNgCordovaDoc(hostEditor, docs.ngCordovaPlugins[possibleDocId]);
        else if (docs.ionicDocs[possibleDocId] != null) 
            return createIonicFrameworkDoc(hostEditor, docs.ionicDocs[possibleDocId]);
        else return null;
    }
    
    function IonicDocs(hostEditor, doc) {
        InlineWidget.call(this);
        
        this.$wrapperDiv = doc.html;
        this.$htmlContent.append(this.$wrapperDiv);
        
        this._sizeEditorToContent   = this._sizeEditorToContent.bind(this);
        this._handleWheelScroll     = this._handleWheelScroll.bind(this);

        this.$scroller = this.$wrapperDiv.find(".scrollable");
        this.$scroller.on("mousewheel", this._handleWheelScroll);
        
        this.load(hostEditor);
    }
    
    IonicDocs.prototype = Object.create(InlineWidget.prototype);
    IonicDocs.prototype.constructor = IonicDocs;
    IonicDocs.prototype.parentClass = InlineWidget.prototype;
    
    IonicDocs.prototype.$wrapperDiv = null;
    IonicDocs.prototype.$scroller = null;
    
    IonicDocs.prototype._handleScrolling = function (event, scrollingUp, scroller) {
        event.stopPropagation();
        if (scrollingUp && scroller.scrollTop === 0) {
            event.preventDefault();
            return true;
        } else if (!scrollingUp && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight) {
            event.preventDefault();
            return true;
        }
        
        return false;
    };
    
    IonicDocs.prototype._handleWheelScroll = function (event) {
        var scrollingUp = (event.originalEvent.wheelDeltaY > 0),
            scroller = event.currentTarget;
        
        if (scroller.clientHeight >= scroller.scrollHeight) {
            return;
        }
        
        this._handleScrolling(event, scrollingUp, scroller);
    };
    
    IonicDocs.prototype.onAdded = function () {
        IonicDocs.prototype.parentClass.onAdded.apply(this, arguments);
        
        this._sizeEditorToContent();
        this.$scroller.focus();
    };
    
    IonicDocs.prototype.onClosed = function () {
        IonicDocs.prototype.parentClass.onClosed.apply(this, arguments);
    };
    
    IonicDocs.prototype._sizeEditorToContent = function () {
        this.hostEditor.setInlineWidgetHeight(this, this.$wrapperDiv.height() + 30, true);
    };
    
    module.exports = createIonicDoc;
});