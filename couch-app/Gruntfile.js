var config = require('./config.json'),
    fs = require('fs');

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
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        separator: ';'
      },
      dist: {
        // the files to concatenate, in order
        src: [
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
          'attachments/css/style.css': ['src/css/*.css']
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
  grunt.loadNpmTasks('grunt-couchapp');

  // Default task(s).
  grunt.registerTask('default', [
    'jshint',
    'concat',
    'uglify',
    'cssmin',
    'template',
    'mkcouchdb',
    'couchapp'
  ]);

};