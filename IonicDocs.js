define(function (require, exports, module) {
    "use strict";
    
    var InlineWidget    = brackets.getModule("editor/InlineWidget").InlineWidget,
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        template        = require('text!templates/IonicDocs.html'),
        docs            = JSON.parse(require('text!docs/ngCordova/plugins.json')),
        marked          = require("lib/marked"),
        docsPath        = ExtensionUtils.getModulePath(module) + "docs/";
    
    ExtensionUtils.loadStyleSheet(module, "css/ionic-brackets.css");
    ExtensionUtils.loadStyleSheet(module, "css/ionicons.css");
    
    function createIonicDoc(hostEditor, possibleDocId) {
        if (docs[possibleDocId] != null) {
            var doc = docs[possibleDocId];
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

                        if (doc.android == "true") 
                            doc.html.find("#ionic-docs-bar").prepend('<i class="icon ion-social-android ionic-docs-icon"></i>');
                        if (doc.ios == "true") 
                            doc.html.find("#ionic-docs-bar").prepend('<i class="icon ion-social-apple ionic-docs-icon"></i>');
                        doc.html.find("#ionic-docs-title").html(doc.name);
                        doc.html.find("#ionic-docs-src").attr('href', doc.source);
                        doc.html.find("#ionic-docs-official").attr('href', doc.officialDocs);

                        deferred.resolve(new IonicDocs(hostEditor, doc));
                    } else {
                        deferred.reject();
                    }
                });
            }
            
            return deferred.promise();
        }
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