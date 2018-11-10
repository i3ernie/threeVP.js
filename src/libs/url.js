/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
deine(["vendor/url", "jquery"], function( url, $ ){
    let main = $("script[data-main]")[0].attr("data-main");
    
    url.currentScriptURL = function(){
        let ret = main.substring( 0, main.indexOf( "js/" ));
        if ( ret === "/" ) { 
            ret = ""; 
        }
        return ret;
    };
    
    return url;
});

