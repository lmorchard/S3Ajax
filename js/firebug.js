/**
    Logging hooks for Firebug.
*/
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
