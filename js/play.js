/**
    Play around with S3Ajax!
*/

Play = {

    /**
    */
    init: function() {
        log("STARTING UP!");
    },

    /**
        Accept new credentials from the form in the page.
    */
    login: function() {
        S3Ajax.KEY_ID     = $('key_id').value;
        S3Ajax.SECRET_KEY = $('secret_key').value;

        // Indicate success.
        $('update_msg').innerHTML = 'Last updated: '+(new Date());
        log("Logged in "+S3Ajax.KEY_ID);
    },

    /**
        Download the specified resource.
    */
    download: function() {
        var _this = this;
        var resource = $('resource').value;
        var d = S3Ajax.httpClient("GET", resource);
        
        d.addCallback(function(rv) {
            $('content').value = rv.responseText;
            $('xfer_msg').innerHTML = "Download succeeded at "+(new Date());
            _this.lastRequest = rv;
        });

        d.addErrback(function(rv) {
            $('xfer_msg').innerHTML = "Download failed at "+(new Date());
            log(rv);
            _this.lastRequest = rv;
        });
    },

    /**
        Upload the specified resource.
    */
    upload: function() {
        var _this = this;
        var resource = $('resource').value;
        var content  = $('content').value;
        var d = S3Ajax.httpClient("PUT", resource, null, content, 
            "text/plain", "public-read", {'posted-by':'S3Ajax'});
        
        d.addCallback(function(rv) {
            $('xfer_msg').innerHTML = "Upload succeeded at "+(new Date());
            _this.lastRequest = rv;
        });

        d.addErrback(function(rv) {
            $('xfer_msg').innerHTML = "Upload failed at "+(new Date());
            log(rv);
            _this.lastRequest = rv;
        });
    },

    /* Help protect against errant end-commas */
    EOF: null
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
logger.addListener('firebug', null, function (msg) { 
    printfire(msg.level + sum(map(function (i) { return ', ' + i; }, msg.info))); 
});

