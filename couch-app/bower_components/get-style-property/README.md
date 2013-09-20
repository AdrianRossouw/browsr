# getStyleProperty - quick & dirty CSS property testing

by [@kangax](https://github.com/kangax) :heart_eyes: :zap: :star2:

See [perfectionkills.com/feature-testing-css-properties/](http://perfectionkills.com/feature-testing-css-properties/)

``` js
var transformProp = getStyleProperty('transform');
// returns WebkitTransform on Chrome / Safari
// or transform on Firefox, or MozTransform on old firefox

// then you can use it when setting CSS
element.style[ transformProp ] = 'translate( 12px, 34px )';

// or simply check if its supported
var supportsTranforms = !!transformProp;
```

## Bower

:bird: This script is a [Bower](https://github.com/twitter/bower) component :bird:

``` bash
bower install desandro/get-style-property
```
