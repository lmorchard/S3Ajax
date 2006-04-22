/*
    Extension rules for S3AjaxWiki
*/

Wiky.rules.wikiinlines = Wiky.rules.wikiinlines.concat(
    { 
        rex:   /([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+)/g, 
        tmplt: '<a class="wikiword" href="$1">$1</a>'
    }
);


Wiky.inverse.wikiinlines = Wiky.inverse.wikiinlines.concat(
    {
        rex: /<a class="?wikiword"? [^>]*?>(.*?)<\/a>/mgi, 
        tmplt:"$1"
    },
    {
        rex: /<a class="?newword"? [^>]*?>(.*?)<\/a>/mgi, 
        tmplt:"$1"
    }
);

