/**
* @author Tim Knip / http://www.floorplanner.com/ / tim at floorplanner.com
* @author Tony Parisi / http://www.tonyparisi.com/
*/
define(["extras/loaders/POVLoader.Parser"], function( POVParser ) {
    var POVLoader = function ()
    {
        this.parser = new POVParser();
    };

    POVLoader.prototype.load = function(url, readyCallback, progressCallback)
    {
        if(url == null || url == undefined || url == "" ) {
            var callBack = callBack || readyCallbackFunc;
            if(callBack) callBack(null);
            else return null  ;
        };

        if (document.implementation && document.implementation.createDocument) {
            require(["text!" + url], function ( responseText ) {
                
                readyCallbackFunc = readyCallback;

                this.parser.parse(responseText, readyCallback, url);
            }.bind(this));
        } else {
            alert("Don't know how to parse XML!");
        }
    };

    return POVLoader;
});
