/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define("./util", function( ){
    return {
        isString: function(arg) {
            return typeof(arg) === 'string';
          },
          isObject: function(arg) {
            return typeof(arg) === 'object' && arg !== null;
          },
          isNull: function(arg) {
            return arg === null;
          },
          isNullOrUndefined: function(arg) {
            return arg == null;
          }
    };
});
