/**
    S3Ajax v0.1 - An AJAX wrapper package for Amazon S3

    http://decafbad.com/trac/wiki/S3Ajax
    l.m.orchard@pobox.com
    Share and Enjoy.

    Requires:
        http://www.mochikit.com/
        http://pajhome.org.uk/crypt/md5/sha1.js
        http://www.svendtofte.com/code/date_format/formatDate.js
*/

S3Ajax = {
    
    /**
        DANGER WILL ROBINSON - Do NOT fill in your KEY_ID and SECRET_KEY 
        here.  These should be supplied by client-side code, and not 
        stored in any server-side files.  Failure to protect your S3
        credentials will result in undesired people doing nasty things
        on your tab.

        For example, scoop values up from un-submitted form fields like so:

        S3Ajax.KEY_ID     = $('key_id').value;
        S3Ajax.SECRET_KEY = $('secret_key').value;
    */
    URL:        'http://s3.amazonaws.com',
    KEY_ID:     '',
    SECRET_KEY: '',

    /**
        Perform an authenticated S3 HTTP query.

        TODO: Remove dependancy on MochiKit?
    */
    httpClient: function(method, resource, params, content, content_type, acl, meta) {

        // Prepare the query string and URL for this request.
        var qs   = (params) ? '?'+queryString(params) : '';
        var url  = this.URL + resource + qs;
        var hdrs = {};

        // Handle Content-Type header
        if (!content_type) content_type = 'text/plain';
        hdrs['Content-Type'] = content_type;

        // Set the timestamp for this request.
        var http_date = this.httpDate();
        hdrs['Date']  = http_date;

        // Huh.  The Perl s3curl script defines a $contentMD5, but it never uses it.
        var content_MD5 = '';
        // if (content) content_MD5 = string.hashMD5(content)

        // Handle the ACL parameter
        var acl_header_to_sign = '';
        if (acl) {
            hdrs['x-amz-acl'] = acl;
            acl_header_to_sign = "x-amz-acl:"+acl+"\n";
        }
        
        // Handle the metadata headers
        var meta_to_sign = '';
        if (meta) {
            for (var k in meta) {
                hdrs['x-amz-meta-'+k] = meta[k];
                meta_to_sign += "x-amz-meta-"+k+":"+meta[k]+"\n";
            }
        }

        // Build the string to sign for authentication.
        var s = method + "\n";
        s = s + content_MD5 + "\n";
        s = s + content_type + "\n";
        s = s + http_date + "\n";
        s = s + acl_header_to_sign;
        s = s + meta_to_sign;
        s = s + resource;

        // Sign the string with our SECRET_KEY.
        var signature = b64_hmac_sha1(this.SECRET_KEY, s)+'=';
        hdrs['Authorization'] = "AWS "+this.KEY_ID+":"+signature;

        // Prepare and fire off the request, return the Deferred.
        var req = getXMLHttpRequest();
        req.open(method, url, true);
        for (var k in hdrs) req.setRequestHeader(k, hdrs[k]);
        var d = sendXMLHttpRequest(req, content);
        return d;
    },
    
    /**
        Return a date formatted appropriately for HTTP Date header.
        TODO: Rewrite to remove formatDate.js dependancy.
        See: http://www.svendtofte.com/code/date_format/
    */
    httpDate: function(d) {
        if (!d) d = new Date();
        return d.formatDate("r");
    },

    /* Help protect against errant end-commas */
    EOF: null

};

