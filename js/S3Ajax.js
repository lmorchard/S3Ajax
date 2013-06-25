//  S3Ajax v0.1 - An AJAX wrapper package for Amazon S3
//
//  http://decafbad.com/trac/wiki/S3Ajax
//  l.m.orchard@pobox.com
//  Share and Enjoy.
//
//  Requires:
//      http://pajhome.org.uk/crypt/md5/sha1.js

// Constructor
function S3Ajax () {
    return this.init.apply(this, arguments);
}

// Methods and properties
S3Ajax.prototype = {

    // Defaults for options accepted in constructor.
    defaults: {
        // Base URL for S3 API
        base_url: 'http://s3.amazonaws.com',
        // Key ID for credentials
        key_id: null,
        // Secret key for credentials
        secret_key: null,
        // Flip this to true to potentially get lots of wonky logging.
        debug: false,
        // Defeat caching with query params on GET requests?
        defeat_cache: false,
        // Default ACL to use when uploading keys.
        default_acl: 'public-read',
        // Default content-type to use in uploading keys.
        default_content_type: 'text/plain; charset=UTF-8',
        // Set to true to make virtual hosted-style requests.
        use_virtual: false
    },

    // Initialize object (called from constructor)
    init: function (options) {
        this.options = options;
        for (var k in this.defaults) {
            if (this.defaults.hasOwnProperty(k)) {
                this[k] = (typeof(options[k]) !== 'undefined') ?
                    options[k] : this.defaults[k];
            }
        }
        return this;
    },

    // Get contents of a key in a bucket.
    get: function (bucket, key, cb, err_cb) {
        return this.httpClient({
            method: 'GET',
            key: key,
            bucket: bucket,
            load: cb, error: err_cb 
        });
    },

    // Head the meta of a key in a bucket.
    head: function (bucket, key, cb, err_cb) {
        return this.httpClient({
            method: 'HEAD',
            key: key,
            bucket: bucket,
            load: cb, error: err_cb 
        });
    },

    // Put data into a key in a bucket.
    put: function (bucket, key, content/*, [params], cb, [err_cb]*/) {

        // Process variable arguments for optional params.
        var idx = 3;
        var params = {};
        if (typeof arguments[idx] === 'object') {
            params = arguments[idx++];
        }
        var cb     = arguments[idx++];
        var err_cb = arguments[idx++];

        if (!params.content_type) {
            params.content_type = this.default_content_type;
        }
        if (!params.acl) {
            params.acl = this.default_acl;
        }

        return this.httpClient({
            method:       'PUT',
            key:          key,
            bucket:       bucket,
            content:      content,
            content_type: params.content_type,
            meta:         params.meta,
            acl:          params.acl,
            load: cb, error: err_cb 
        });
    },

    // List buckets belonging to the account.
    listBuckets: function (cb, err_cb) {
        return this.httpClient({ 
            method: 'GET', resource:'/', 
            force_lists: [ 'ListAllMyBucketsResult.Buckets.Bucket' ],
            load: cb, error: err_cb 
        });
    },

    // Create a new bucket for this account.
    createBucket: function (bucket, cb, err_cb) {
        return this.httpClient({ 
            method: 'PUT', resource: '/'+bucket, 
            load: cb, error: err_cb 
        });
    },

    // Delete an empty bucket.
    deleteBucket: function (bucket, cb, err_cb) {
        return this.httpClient({ 
            method: 'DELETE', resource: '/'+bucket, 
            load: cb, error: err_cb 
        });
    },

    // Given a bucket name and parameters, list keys in the bucket.
    listKeys: function (bucket, params, cb, err_cb) {
        return this.httpClient({
            method: 'GET', resource: '/'+bucket, 
            force_lists: [ 'ListBucketResult.Contents' ],
            params: params, 
            load: cb, error: err_cb
        });
    },

    // Delete a single key in a bucket.
    deleteKey: function (bucket, key, cb, err_cb) {
        return this.httpClient({
            method:'DELETE', resource: '/'+bucket+'/'+key,
            load: cb, error: err_cb
        });
    },

    // Delete a list of keys in a bucket, with optional callbacks for each
    // deleted key and when list deletion is complete.
    deleteKeys: function (bucket, list, one_cb, all_cb) {
        var _this = this;
        
        // If the list is empty, then fire off the callback.
        if (!list.length && all_cb) { return all_cb(); }

        // Fire off key deletion with a callback to delete the 
        // next part of list.
        var key = list.shift();
        this.deleteKey(bucket, key, function () {
            if (one_cb) { one_cb(key); }
            _this.deleteKeys(bucket, list, one_cb, all_cb);
        });
    },

    // Perform an authenticated S3 HTTP query.
    httpClient: function (kwArgs) {
        var _this = this;
        
        // If need to defeat cache, toss in a date param on GET.
        if (this.defeat_cache && (kwArgs.method === "GET" || 
                                  kwArgs.method === "HEAD") ) {
            if (!kwArgs.params) { kwArgs.params = {}; }
            kwArgs.params.___ = new Date().getTime();
        }

        // Prepare the query string and URL for this request.
        var qs = '', sub_qs = '';
        if (kwArgs.params) {
            qs = '?'+this.queryString(kwArgs.params);
            // Sub-resource parameters, if present, must be included in CanonicalizedResources.
            // NOTE: These paramters must be sorted lexicographically in StringToSign.
            var subresource_params = {};
            var subresource_params_all = ["acl", "lifecycle", "location", "logging",
                                          "notification", "partNumber", "policy",
                                          "requestPayment", "torrent", "uploadId",
                                          "uploads", "versionId", "versioning",
                                          "versions", "website"];
            for (var k in subresource_params_all)
                if (subresource_params_all[k] in kwArgs.params)
                    subresource_params[subresource_params_all[k]] = kwArgs.params[subresource_params_all[k]];
            sub_qs = Object.keys(subresource_params).length ? '?' + this.queryString(subresource_params) : '';
        }

        if (this.use_virtual)
            var resource = '/' + kwArgs.key;
        else
            var resource = '/' + kwArgs.bucket + '/' + kwArgs.key;
        var url = this.base_url + resource + qs;
        var hdrs = {};

        // Handle Content-Type header
        if (!kwArgs.content_type && kwArgs.method === 'PUT') {
            kwArgs.content_type = 'text/plain';
        }
        if (kwArgs.content_type) {
            hdrs['Content-Type'] = kwArgs.content_type;
        } else {
            kwArgs.content_type = '';
        }

        // Set the timestamp for this request.
        var http_date = this.httpDate();
        hdrs['x-amz-date']  = http_date;

        var content_MD5 = '';
        /*
        // TODO: Fix this Content-MD5 stuff.
        if (kwArgs.content && kwArgs.content.hashMD5) {
            content_MD5 = kwArgs.content.hashMD5();
            hdrs['Content-MD5'] = content_MD5;
        }
        */

        // Handle the ACL parameter
        var acl_header_to_sign = '';
        if (kwArgs.acl) {
            hdrs['x-amz-acl'] = kwArgs.acl;
            acl_header_to_sign = "x-amz-acl:"+kwArgs.acl+"\n";
        }
        
        // Handle the metadata headers
        var meta_to_sign = '';
        if (kwArgs.meta) {
            for (var k in kwArgs.meta) {
                if (kwArgs.meta.hasOwnProperty(k)) {
                    hdrs['x-amz-meta-'+k] = kwArgs.meta[k];
                    meta_to_sign += "x-amz-meta-"+k+":"+kwArgs.meta[k]+"\n";
                }
            }
        }

        // Only perform authentication if non-anonymous and credentials available
        if (kwArgs.anonymous !== true && this.key_id && this.secret_key) {

            // Build the string to sign for authentication.
            var s = [
                kwArgs.method, "\n",
                content_MD5, "\n",
                kwArgs.content_type, "\n",
                "\n", // was Date header, no longer works with modern browsers.
                acl_header_to_sign,
                'x-amz-date:', http_date, "\n",
                meta_to_sign,
                '/' + kwArgs.bucket + '/' + kwArgs.key,
                sub_qs
            ].join('');

            // Sign the string with our secret_key.
            var signature = this.hmacSHA1(s, this.secret_key);
            hdrs.Authorization = "AWS "+this.key_id+":"+signature;
        }

        // Perform the HTTP request.
        var req = this.getXMLHttpRequest();
        req.open(kwArgs.method, url, true);
        for (var j in hdrs) { 
            if (hdrs.hasOwnProperty(j)) {
                req.setRequestHeader(j, hdrs[j]);
            }
        }
        req.onreadystatechange = function () {
            if (req.readyState === 4) {

                // Pre-digest the XML if needed.
                var obj = null;
                if (req.responseXML && kwArgs.parseXML !== false) {
                    obj = _this.xmlToObj(req.responseXML, kwArgs.force_lists);
                }

                // Stash away the last request details, if debug active.
                if (_this.debug) {
                    window._lastreq = req;
                    window._lastobj = obj;
                }
                
                // Dispatch to appropriate handler callback
                if ( (req.status >= 400 || (obj && obj.Error) ) && kwArgs.error) {
                    return kwArgs.error(req, obj);
                } else {
                    return kwArgs.load(req, obj);
                }

            }
        };
        req.send(kwArgs.content);
        return req;
    },

    // Turn a simple structure of nested XML elements into a JavaScript object.
    //
    // TODO: Handle attributes?
    xmlToObj: function (parent, force_lists, path) {
        var obj = {};
        var cdata = '';
        var is_struct = false;

        for(var i=0,node; node=parent.childNodes[i]; i++) {
            if (3 === node.nodeType) { 
                cdata += node.nodeValue;
            } else {
                is_struct = true;
                var name  = node.nodeName;
                var cpath = (path) ? path+'.'+name : name;
                var val   = arguments.callee(node, force_lists, cpath);

                if (!obj[name]) {
                    var do_force_list = false;
                    if (force_lists) {
                        for (var j=0,item; item=force_lists[j]; j++) {
                            if (item === cpath) {
                                do_force_list=true; break;
                            }
                        }
                    }
                    obj[name] = (do_force_list) ? [ val ] : val;
                } else if (obj[name].length) {
                    // This is a list of values to append this one to the end.
                    obj[name].push(val);
                } else {
                    // Has been a single value up till now, so convert to list.
                    obj[name] = [ obj[name], val ];
                }
            }
        }

        // If any subnodes were found, return a struct - else return cdata.
        return (is_struct) ? obj : cdata;
    },

    // Abstract HMAC SHA1 signature calculation.
    // see: http://pajhome.org.uk/crypt/md5/sha1.js
    hmacSHA1: function (data, secret) {
        return b64_hmac_sha1(secret, data)+'=';
    },
    
    // Return a date formatted appropriately for HTTP Date header.
    // Inspired by: http://www.svendtofte.com/code/date_format/
    httpDate: function (d) {
        // Use now as default date/time.
        if (!d) { d = new Date(); }

        // Date abbreviations.
        var daysShort   = ["Sun", "Mon", "Tue", "Wed",
                           "Thu", "Fri", "Sat"];
        var monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // See: http://www.quirksmode.org/js/introdate.html#sol
        function takeYear (theDate) {
            var x = theDate.getYear();
            var y = x % 100;
            y += (y < 38) ? 2000 : 1900;
            return y;
        }

        // Number padding function
        function zeropad (num, sz) { 
            return ( (sz - (""+num).length) > 0 ) ? 
                arguments.callee("0"+num, sz) : num; 
        }
        
        function gmtTZ (d) {
            // Difference to Greenwich time (GMT) in hours
            var os = Math.abs(d.getTimezoneOffset());
            var h = ""+Math.floor(os/60);
            var m = ""+(os%60);
            if (h.length === 1) { h = "0"+h; }
            if (m.length === 1) { m = "0"+m; }
            return d.getTimezoneOffset() < 0 ? "+"+h+m : "-"+h+m;
        }

        return [
            daysShort[d.getDay()], ", ",
            d.getDate(), " ",
            monthsShort[d.getMonth()], " ",
            takeYear(d), " ",
            zeropad(d.getHours(), 2), ":",
            zeropad(d.getMinutes(), 2), ":",
            zeropad(d.getSeconds(), 2), " ",
            gmtTZ(d)
        ].join('');
    },

    // Encode an object's properties as an query params
    queryString: function (params) {
        var k, l = [];
        for (k in params) {
            if (params.hasOwnProperty(k)) {
                l.push(k+'='+encodeURIComponent(params[k]));
            }
        }
        return l.join("&");
    },

    // Get an XHR object, somehow.
    getXMLHttpRequest: function () {
        // Shamelessly swiped from MochiKit/Async.js
        var self = arguments.callee;
        if (!self.XMLHttpRequest) {
            var tryThese = [
                function () { return new XMLHttpRequest(); },
                function () { return new ActiveXObject('Msxml2.XMLHTTP'); },
                function () { return new ActiveXObject('Microsoft.XMLHTTP'); },
                function () { return new ActiveXObject('Msxml2.XMLHTTP.4.0'); },
                function () { return null; }
            ];
            for (var i = 0; i < tryThese.length; i++) {
                var func = tryThese[i];
                try {
                    self.XMLHttpRequest = func;
                    return func();
                } catch (e) {
                    // pass
                }
            }
        }
        return self.XMLHttpRequest();
    }
};

/*jshint forin:true, noempty:true, eqeqeq:true, boss:true, bitwise:true, curly:true, browser:true, indent:4, maxerr:50 */
