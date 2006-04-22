/**
    Play around with S3Ajax!

    TODO: Remove Dojo dependency
*/

if (window.dojo) {
    // dojo.setModulePrefix("dojo", "js/dojo");
    // dojo.require("dojo.io.*");
    // dojo.require("dojo.crypto.SHA1");
    dojo.require("dojo.storage.*");
}

Play = {

    /**
        Initialize the play app.
    */
    init: function() {
        var _this = this;

        S3Ajax.DEBUG = true;

        // HACK: Wait for the storage flash to become available.
        // TODO: Look for an official Dojo event to make this happen.
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
        Make an attempt to recall S3 credentials.
    */
    recall: function() {
        if (window.dojo && dojo.storage.get('key_id', '/S3Ajax')) {
            S3Ajax.KEY_ID     = dojo.storage.get('key_id',     '/S3Ajax');
            S3Ajax.SECRET_KEY = dojo.storage.get('secret_key', '/S3Ajax');
            $('key_id').value = S3Ajax.KEY_ID;
            $('update_msg').innerHTML = 'Credentials fetched from local storage: '+(new Date());

            // this.listbuckets();
            // this.list();
        }
    },

    /**
        Accept new credentials from the form in the page.
    */
    login: function() {
        S3Ajax.KEY_ID     = $('key_id').value;
        S3Ajax.SECRET_KEY = $('secret_key').value;

        // Try to stash the credentials away for next time.
        if (window.dojo) {
            dojo.storage.set('key_id',     S3Ajax.KEY_ID,     '/S3Ajax');
            dojo.storage.set('secret_key', S3Ajax.SECRET_KEY, '/S3Ajax');
        }

        $('update_msg').innerHTML = 'Last updated: '+(new Date());
    },

    /**
        Download the specified resource.
    */
    download: function() {
        var bucket = $('list_bucket').value;
        var key    = $('key').value;

        $('content').value = "Loading...";

        S3Ajax.get(bucket, key,
            function(req, content) {
                $('content').value = content;
                $('xfer_msg').innerHTML = "Download succeeded at "+(new Date());
            },
            function(req, objc) {
                $('xfer_msg').innerHTML = "Download failed at "+(new Date());
            }
        );
    },

    /**
        Upload the specified resource.
    */
    upload: function() {
        var bucket   = $('list_bucket').value;
        var key      = $('key').value;
        var content  = $('content').value;

        S3Ajax.put(bucket, key, content,
            function(req) {
                $('xfer_msg').innerHTML = "Upload succeeded at "+(new Date());
            },
            function(req, obj) {
                $('xfer_msg').innerHTML = "Upload failed at "+(new Date());
            }
        );

        /*
        S3Ajax.put(bucket, key, content,
            {
                content_type: "text/plain",
                meta:         {'posted-by':'S3Ajax'},
                acl:          "public-read",
            },
            function(req) {
                $('xfer_msg').innerHTML = "Upload succeeded at "+(new Date());
            },
            function(req, obj) {
                $('xfer_msg').innerHTML = "Upload failed at "+(new Date());
            }
        );
        */
    },

    /**
        List available buckets
    */
    listbuckets: function() {
        var _this = this;

        setList('buckets_list',['Loading...','']);

        S3Ajax.listBuckets(
            function(req, obj) {
                clearList('buckets_list');
                if (obj.ListAllMyBucketsResult) {
                    var buckets = obj.ListAllMyBucketsResult.Buckets.Bucket;
                    for (var i=0, bucket; bucket=buckets[i]; i++) {
                        addToList(
                            'buckets_list',
                            bucket.Name + ' ['+bucket.CreationDate+']',
                            bucket.Name
                        );
                    }
                }
                keys_list = null;
            },
            function(req) {
                setList('buckets_list', ["Buckets list failed at "+(new Date()),'']);
            }
        );

    },

    /**
        Change the current bucket to one selected in list.
    */
    selectbucket: function() {
        var sel = getSelected('buckets_list');
        if (sel.length) $('list_bucket').value = sel[0]; 
    },

    /**
    */
    deletebucket: function() {
        var _this = this;
        var sel = getSelected('buckets_list');
        if (!sel.length) return;

        setList('buckets_list',['Deleting...','']);
        S3Ajax.deleteBucket(sel[0], function() {
            _this.listbuckets();
        });
    },

    /**
    */
    createbucket: function() {
        var _this = this;
        var bucket = $('list_bucket').value;

        setList('buckets_list',['Creating...','']);
        S3Ajax.createBucket(bucket, function() {
            _this.listbuckets();
        });
    },

    /**
        List a bucket's contents.
    */
    list: function() {
        var _this = this;
        setList('keys_list', ['Loading...','']);

        var bucket = $('list_bucket').value;

        var params = {};
        if ($('list_prefix').value)  params['prefix']   = $('list_prefix').value;
        if ($('list_maxkeys').value) params['max-keys'] = $('list_maxkeys').value;
        if ($('list_marker').value)  params['marker']   = $('list_marker').value;

        S3Ajax.listKeys(bucket, params, 
            function(req, obj) {
                clearList('keys_list');
                var contents = obj.ListBucketResult.Contents;
                for (var i=0, item; item=contents[i]; i++) {
                    addToList(
                        'keys_list',
                        /*item.LastModified + ' ' +*/ item.Key + ' (' + item.Size + ')',
                        item.Key
                    );
                }
            },
            function(req, obj) {
                setList('keys_list', ["Keys list failed at "+(new Date()),'']);
            }
        );
    },

    /**
        Download the selected key.
    */
    downloadSelectedKey: function() {
        var sel = getSelected('keys_list');
        if (sel.length) {
            $('key').value = sel[0]; 
            this.download();
        }
    },

    /**
        Delete seleted keys.
    */
    deleteSelectedKeys: function() {
        var _this = this;
        var sel_keys = getSelected('keys_list');

        if (!window.confirm("Delete " + sel_keys.length + " selected items?")) return;

        S3Ajax.deleteKeys($('list_bucket').value, sel_keys, 
            function(key)      { /*logFire("Deleted "+key);*/ },
            function(req, obj) { /*logFire("Deleted all");*/ _this.list(); }
        );
    },

    /* Help protect against errant end-commas */
    EOF: null
}
addLoadEvent(function(){ Play.init() });
