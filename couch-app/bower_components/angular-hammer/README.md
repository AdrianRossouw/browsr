Angular Hammer v2
=================

Within an AngularJS application, allows you to specify custom behaviour on Hammer.js touch events.

[See it in action](http://monospaced.github.io/angular-hammer).

Usage
-----

as attribute

    hm-tap="{expression}"

as class

    class="hm-tap: {expression};"

change the default settings for the instance by adding a second attribute or class with [options](https://github.com/EightMedia/hammer.js/wiki/Getting-Started#gesture-options)

    hm-options="{drag: false, transform: false}"

    class="hm-options: {drag: false, transform: false};"

Install
-------

    bower install monospaced/angular-hammer

Include the `angular-hammer.js` script provided by this component in your app, and add `hmTouchEvents` to your app’s dependencies.

Requires [Hammer.js](http://eightmedia.github.io/hammer.js/), tested with `v1.0.5`.

Demo
----------------

[monospaced.github.io/angular-hammer](http://monospaced.github.io/angular-hammer)