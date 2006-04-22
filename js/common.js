/**
    Common can't-live-without stuff from MochiKit, Dojo, etal.
    Share and Enjoy
*/

if (!window.Node) {
   window.Node = {
      ELEMENT_NODE : 1,
      ATTRIBUTE_NODE : 2,
      TEXT_NODE : 3,
      CDATA_SECTION_NODE : 4,
      ENTITY_REFERENCE_NODE : 5,
      ENTITY_NODE : 6,
      PROCESSING_INSTRUCTIONS_NODE : 7,
      COMMENT_NODE : 8,
      DOCUMENT_NODE : 9,
      DOCUMENT_TYPE_NODE : 10,
      DOCUMENT_FRAGMENT_NODE : 11,
      NOTATION_NODE : 12
   }
}

if (!window['addLoadEvent']) {
    // See: http://simon.incutio.com/archive/2004/05/26/addLoadEvent
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
    // Swiped from MochiKit / Prototype
    function $(id) { return document.getElementById(id); }
}

/**
    Get the parsed XML response from an HTTP request, even if
    the server claimed a non-XML mimetype.
*/
function getResponseXML(rv) {
    if (rv.responseXML) return rv.responseXML;
    else return loadXML(rv.responseText);
}

function loadXML(data) {
    if (DOMParser) return (new DOMParser()).parseFromString(data, 'text/xml');
    if (ActiveXObject) return (new ActiveXObject("microsoft.XMLDOM")).loadXML(data);
    return null;
}

function clearList(lid) {
    $(lid).options.length = 0;
}

function addToList(lid, label, key) {
    var list = $(lid);
    list.options[list.options.length] = new Option(label, key);
}

function setList(lid, items) {
    var list = $(lid);
    this.clearList(lid);
    for(i=0;i<items.length;i+=2) {
        list.options[i/2] = new Option(items[i],items[i+1]);
    }
}

function getSelected(lid) {
    var sel = [];
    var options = $(lid).options;
    for (var i=0, item; item=options[i]; i++) {
        if (item.selected) sel.push(item.value);
    }
    return sel;
}

/*
    Mini MochiKit
*/

function forEach(list, fn) {
    for (var i=0; i<list.length; i++) fn(list[i]);
}

function filter(fn, list) {
    var rv = [];
    for (var i=0; i<list.length; i++)
        if (fn(list[i])) 
            rv[rv.length] = list[i];
    return rv;
}

function map(fn, list) {
    var rv = [];
    for (var i=0; i<list.length; i++) rv[rv.length] = fn(list[i]);
    return rv;
}

function appendChildNodes(parent, nodes) {
    for (var i=0; i<nodes.length; i++) {
        var node = nodes[i];
        if (node.nodeType) 
            parent.appendChild(node);
        else if ( (typeof(node) == 'object') && node.length)
            appendChildNodes(parent, node);
        else
            parent.appendChild(document.createTextNode(''+node));
    }
}

function createDOM(name, attrs, nodes) {
    var elem = document.createElement(name);
    if (attrs) for (k in attrs) {
        var v = attrs[k];

        if (k.substring(0, 2) == "on") {
            if (typeof(v) == "string") {
                v = new Function(v);
            }
            elem[k] = v;
        } else {
            elem.setAttribute(k, v);
        }

        switch(k) {
            // MSIE seems to want this.
            case 'class': elem.className = v; break;
        }
    }
    if (nodes) appendChildNodes(elem, nodes);
    return elem;
}

function createDOMFunc(name) {
    return function(attrs) {
        var nodes = [];
        for (var i=1; i<arguments.length; i++) 
            nodes[nodes.length] = arguments[i];
        return createDOM(name, attrs, nodes);
    }
}

forEach([ 
    'A', 'BUTTON', 'BR', 'CANVAS', 'DIV', 'FIELDSET', 'FORM',
    'H1', 'H2', 'H3', 'HR', 'IMG', 'INPUT', 'LABEL', 'LEGEND', 'LI', 'OL',
    'OPTGROUP', 'OPTION', 'P', 'PRE', 'SELECT', 'SPAN', 'STRONG', 'TABLE', 'TBODY',
    'TD', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TR', 'TT', 'UL' 
    ], function(n) { window[n] = createDOMFunc(n); });

