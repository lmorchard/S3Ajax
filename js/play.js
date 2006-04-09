/**
    Play around with S3Ajax!
*/

if (window.dojo) {
    // dojo.setModulePrefix("dojo", "js/dojo");
    // dojo.require("dojo.io.*");
    // dojo.require("dojo.crypto.SHA1");
    dojo.require("dojo.storage.*");
}

Play = {

    /**
    */
    init: function() {
        var _this = this;

        S3Ajax.DEBUG = true;

        // HACK: Wait for the storage flash to become available, 
        if (window.dojo) {
            this._storage_wait = setInterval(function() {
                if ($('dojo-storeContainer')) {
                    clearInterval(_this._storage_wait);
                    _this._storage_wait = null;
                    _this.recall();
                }
            }, 100);
        }
    },
    
    /**
    */
    recall: function() {
        if (window.dojo && dojo.storage.get('key_id', '/S3Ajax')) {
            S3Ajax.KEY_ID     = dojo.storage.get('key_id',     '/S3Ajax');
            S3Ajax.SECRET_KEY = dojo.storage.get('secret_key', '/S3Ajax');
            $('key_id').value = S3Ajax.KEY_ID;
            $('update_msg').innerHTML = 'Login fetched from local storage: '+(new Date());
        }
    },

    /**
        Accept new credentials from the form in the page.
    */
    login: function() {
        S3Ajax.KEY_ID     = $('key_id').value;
        S3Ajax.SECRET_KEY = $('secret_key').value;

        if (window.dojo) {
            dojo.storage.set('key_id',     S3Ajax.KEY_ID,     '/S3Ajax');
            dojo.storage.set('secret_key', S3Ajax.SECRET_KEY, '/S3Ajax');
        }

        // Indicate success.
        $('update_msg').innerHTML = 'Last updated: '+(new Date());
    },

    /**
        Download the specified resource.
    */
    download: function() {
        var _this = this;
        var resource = $('resource').value;

        var req = S3Ajax.httpClient({
            method:   'GET',
            resource: resource,
            load: function(rv) {
                $('content').value = rv.responseText;
                $('xfer_msg').innerHTML = "Download succeeded at "+(new Date());
                _this.lastRequest = rv;
            },
            error: function(rv) {
                $('xfer_msg').innerHTML = "Download failed at "+(new Date());
                _this.lastRequest = rv;
            }
        });

    },

    /**
        Upload the specified resource.
    */
    upload: function() {
        var _this = this;
        var resource = $('resource').value;
        var content  = $('content').value;

        var req = S3Ajax.httpClient({
            method:       'PUT',
            resource:     resource,
            content_type: "text/plain",
            content:      content,
            meta:         {'posted-by':'S3Ajax'},
            acl:          "public-read",
            load:  function(rv) {
                $('xfer_msg').innerHTML = "Upload succeeded at "+(new Date());
                _this.lastRequest = rv;
            },
            error: function(rv) {
                $('xfer_msg').innerHTML = "Upload failed at "+(new Date());
                _this.lastRequest = rv;
            }
        });
    },


    /**

    */
    list: function() {
        var _this = this;
        var resource = $('resource').value;

        var req = S3Ajax.httpClient({
            method:   'GET',
            resource: resource,
            /* params: {'prefix':'js', 'max-keys':10 }, */
            load: function(req, obj) {
                if (obj.ListBucketResult) {
                    var out = '';
                    var contents = obj.ListBucketResult.Contents;
                    for (var i=0, item; item=contents[i]; i++) {
                        out += item.LastModified + ' ' + item.Key + ' (' + item.Size + ')\n';
                    }
                    $('content').value = out;
                }
            },
            error: function(req) {
                $('xfer_msg').innerHTML = "Bucket list failed at "+(new Date());
            }
        });

    },

    /**

    */
    listbuckets: function() {
        var _this = this;
        var req = S3Ajax.httpClient({
            method:   'GET',
            resource: '/',
            load: function(req, obj) {
                if (obj.ListAllMyBucketsResult) {
                    var out = '';
                    var buckets = obj.ListAllMyBucketsResult.Buckets.Bucket;
                    for (var i=0, bucket; bucket=buckets[i]; i++) {
                        out += bucket.Name + ' ['+bucket.CreationDate+']\n';
                    }
                    $('content').value = out;
                }
            },
            error: function(req) {
                $('xfer_msg').innerHTML = "Buckets list failed at "+(new Date());
            }
        });

    },

    /* Help protect against errant end-commas */
    EOF: null
}

if (!window['addLoadEvent']) {
    function addLoadEvent(func) {
        var oldonload = window.onload;
        if (typeof window.onload != 'function') {
            window.onload = func;
        } else {
            window.onload = function() {
                oldonload();
                func();
            }
        }
    }
}
if (!window['$']) {
    function $(id) { return document.getElementById(id); }
}

addLoadEvent(function(){ Play.init() });

/*************************************************************************/
/* Janky logging crud follows.                                           */
/*************************************************************************/

useFireBug = true;

printfire = function() { 
    printfire.args = arguments; 
    // Opera8 does not support dispatchEvent() 
    // as global method (not required by W3C). 
    // This helps to sort it out. 
    try { 
        if (!useFireBug) { 
            // Mozilla installations without FireBug extension 
            throw 'useAlertFunction'; 
        } 
        var ev = document.createEvent("Events"); 
        ev.initEvent("printfire", false, true); 
        // FireBug needs dispatchEvent() to be global 
        // otherwise it fails 
        dispatchEvent(ev); 
    } catch (noConsole) { 
        alert(arguments[0]); 
    } 
} 
logFire = function() { 
    if (window.printfire) { 
        printfire( arguments[0], arguments[1]); 
    } 
}
if (window['logger'] && logger.addListener) {
    logger.addListener('firebug', null, function (msg) { 
        printfire(msg.level + sum(map(function (i) { return ', ' + i; }, msg.info))); 
    });
}
