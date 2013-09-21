var config = require('./config.json'),
    fs = require('fs'),
    _ = require('underscore');

if (fs.existsSync('./config.local.json')) {
    config = require('./config.local.json');
}

function get_templates (source, target) {
    var files = fs.readdirSync(source),
    template = {};

    files.forEach(function (file) {
        template[target + file] = [source + file];
    });

    return template;
}

module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['src/js/app.js', 'app.js', 'Gruntfile.js'],
            options: {
                browser: true
            }
        },
        copy: {
            dist: {
                expand: true, flatten: true, filter: 'isFile',
                src: ['bower_components/bootstrap/dist/fonts/*'],
                dest: 'attachments/fonts/'
            }
        },
        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: ';'
            },
            dist: {
                // the files to concatenate, in order
                src: [
                    "bower_components/jquery/jquery.js",
                    "bower_components/jquery-bridget/jquery.bridget.js",
                    "bower_components/get-style-property/get-style-property.js",
                    "bower_components/get-size/get-size.js",
                    "bower_components/eventEmitter/EventEmitter.js",
                    "bower_components/eventie/eventie.js",
                    "bower_components/doc-ready/doc-ready.js",
                    "bower_components/matches-selector/matches-selector.js",
                    "bower_components/outlayer/item.js",
                    "bower_components/outlayer/outlayer.js",
                    "bower_components/masonry/masonry.js",
                    "bower_components/imagesloaded/imagesloaded.js",

                    "bower_components/angular/angular.min.js",
                    "bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js",
                    "bower_components/angular-masonry/angular-masonry.js",
                    "bower_components/CornerCouch/angular-cornercouch.js",
                    "bower_components/nginfinitescroll/build/ng-infinite-scroll.js",

                    //'attachments/js/bower.js',
                    'src/js/*.js'
                ],
                // the location of the resulting JS file
                dest: 'attachments/js/app.js'
            }
        },
        uglify: {
            options: {},
            build: {
                files: {
                    'attachments/js/app.min.js': ['attachments/js/app.js']
                }
            }
        },
        cssmin: {
            minify: {
                files: {
                    'attachments/css/style.css': ['bower_components/bootstrap/dist/css/bootstrap.css', 'src/css/*.css']
                }
            }
        },
        template: {
            html: {
                options: {
                    data: config.template
                },
                files: get_templates('src/views/', 'attachments/')
            }
        },
        rmcouchdb: {
            app: config.couchapp
        },
        mkcouchdb: {
            app: config.couchapp
        },
        couchapp: {
            app: config.couchapp
        }
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-couchapp');

    // Default task(s).
    grunt.registerTask('default', [
        'jshint',
        'concat',
        'copy',
        'uglify',
        'cssmin',
        'template',
        'mkcouchdb',
        'couchapp'
    ]);

};
