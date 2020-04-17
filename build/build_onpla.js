/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

const _ = require('lodash');

const pkg = require('../package.json');
const dirs = pkg.directories;

const requireconfig = require("../config_onpla.json");

const task_onpla = function( done ){
    const name = "vendor/require/require";
    const out = "require.js";
    
    plugins.requirejs (
        _.extend({}, requireconfig,
            {
                "name"      : name,
                "exclude"   : [],
                "out"       : out,
                "include" : ["underscore", "OKP", "i18n"]
            })
        ).on( "error", console.log )
    .pipe( gulp.dest( dirs.dist ) );
    
    console.log( dirs.dist + "/" + out );
    
    done();
};

module.exports = task_onpla;
    
    
