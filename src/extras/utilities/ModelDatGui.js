/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["lodash", "dat-gui"], function( _, dat )
{       
    const defaults = {
        open : false
    };
    
    /**
     * ModelDatGUI constructor
     * 
     * @param {type} model
     * @param {type} opt
     * @returns {ModelDatGuiL#6.ModelDatGUI}
     */
    let ModelDatGUI = function( model, opt )
    {        
        this.options = _.extend({}, defaults, opt);
        
        //ToDo: opt.filter
        dat.GUI.call( this ); 
        
        if ( model ) _addModel( this, model );
   
        if ( this.options.open ) this.open();
    };
    
    ModelDatGUI.prototype = _.create( dat.GUI.prototype, { 
        constructor : ModelDatGUI,

        addModel : function( model ){
            _addModel(this, model);
        },
        
        addModelFolder : function( model, n ){
            if (typeof model !== "object" ){
                console.log("model must be Backbone.Model");
            }
            let name = ( typeof n === "string" )? n : model.attributes.name || "GUI";
            
            var f = this.addFolder( name );
            _addModel( f, model );
            return this;
        }
    });
    
    let _addModel = function( gui, model )
    {
        let o = model.toJSON();
        let b = model.bounds;
        
        _.each(b, function( v, k ){
            const f = function( val ){ 
                let p ={}; p[k]=val; 
                model.set( p, {validate:true} ); 
            };
            
            if( v.type === "number" && v.min !== undefined ) gui.add(o, k).min( v.min ).max( v.max ).step(v.step||1).listen().onChange( f );
            if( v.list ) gui.add(o, k, v.list ).onChange( f );
            if( v.type === "boolean" ) gui.add(o, k).onChange( f );
            if( v.type === "color" ){
                  let conf = {};
                  conf[k] = v.color;
                  gui.addColor(conf, k).onChange( f );
            } 
        });
    };
            
    return ModelDatGUI;
});

