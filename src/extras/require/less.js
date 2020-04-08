define(['require'], function( require ) {
  
  let lessAPI = {};
  
  lessAPI.pluginBuilder = './less-builder';
  
  if ( typeof window === 'undefined' ) {
    lessAPI.load = function( n, r, load ) {
      load();
    };

    return lessAPI;
  }
  
  lessAPI.normalize = function( name, normalize ) {
    if ( name.substr(name.length - 5, 5) === '.less' ){
      name = name.substr(0, name.length - 5);
    }

    name = normalize( name );

    return name;
  };
  
  let head = document.getElementsByTagName('head')[0];

  let base = document.getElementsByTagName('base');
  base = base && base[0] && base[0] && base[0].href;

  let pagePath = (base || window.location.href.split('#')[0].split('?')[0]).split('/');
  pagePath[pagePath.length - 1] = '';
  pagePath = pagePath.join('/');

  let styleCnt = 0;
  let curStyle;

  lessAPI.inject = function(css) {
    if (styleCnt < 31) {
      curStyle = document.createElement('style');
      curStyle.type = 'text/css';
      head.appendChild(curStyle);
      styleCnt++;
    }
    if (curStyle.styleSheet)
      curStyle.styleSheet.cssText += css;
    else
      curStyle.appendChild( document.createTextNode(css) );
  };

  lessAPI.load = function( lessId, req, load, config ) {
    window.less = config.less || {};
    window.less.env = window.less.env || 'development';

    if (window.less.env === 'prod' ){
      return load();
    }

    require(['lessc2', 'normalize'], function( lessc, normalize ) {

      let fileUrl = req.toUrl( lessId + '.less' );
      fileUrl = normalize.absoluteURI( fileUrl, pagePath );

      lessc.render('@import (multiple) "' + fileUrl + '";', config.less, function( err, tree )
      {
        if ( err ){
          return load.error(err);
        }

        //lessAPI.inject( normalize( tree.css, fileUrl, pagePath) );
        lessAPI.inject( tree.css );

        setTimeout( load, 7 );

      }, window.less);

    },function( err ){
      console.error( err );
    });
  };
  
  return lessAPI;
});
