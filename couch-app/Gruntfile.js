var config = require('./config.json'),
fs = require('fs'),
_ = require('underscore');



module.exports = function (grunt) {
    grunt.option('color', false);

    var override = grunt.option('config');
    if (override && grunt.file.exists(override)) {
        config = grunt.file.readJSON(override);
    }

    // Project configuration.
    grunt.initConfig({
        watch: {
            all: {
                files: ['src/js/*.js', 'src/views/*.jade', 'src/css/*.css'],
                tasks: ['default'],
                options: {'beep' : false }

            }
        },
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['src/js/app.js', 'app.js', 'Gruntfile.js'],
            options:{
                curly:true,
                eqeqeq:true,
                immed:true,
                newcap:true,
                noarg:true,
                sub:true,
                boss:true,
                browser: true,
                eqnull:true
            },
            globals:{
                angular: false

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
                    "bower_components/underscore/underscore.js",
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
                    "bower_components/angular-masonry/angular-masonry.js",
                    "bower_components/CornerCouch/angular-cornercouch.js",
                    "bower_components/nginfinitescroll/build/ng-infinite-scroll.js",

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
        jade: {
            html: {
                options: {
                    data: config.template
                },
                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        flatten: true,
                        src: ['src/views/*.jade'], // Actual pattern(s) to match.
                        dest: 'attachments/',   // Destination path prefix.
                        ext: '.html',   // Dest filepaths will have this extension.
                    }
                ]
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
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-couchapp');

    // Default task(s).
    grunt.registerTask('default', [
        'jshint',
        'concat',
        'copy',
        'uglify',
        'cssmin',
        'jade',
        'mkcouchdb',
        'couchapp'
    ]);

};
