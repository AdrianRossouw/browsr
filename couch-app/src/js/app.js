/* jshint unused:false */
var fuckingGlobal = null;

var app = angular.module('tumblrBrowsr', ['CornerCouch', 'wu.masonry', 'infinite-scroll', 'ngRoute', 'elasticjs.service'])
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/site/:site', {})
            .when('/tag/:tag', {})
            .when('/', {})
            .otherwise({redirectTo: '/site/tof34'});

        //$locationProvider.html5Mode(true);

        
    }])
    .directive('magnificPopup', function() {
        return {
            restrict: 'A',
            link: magnificPopupLink
        };
    })
    .directive('imagesLoaded', function() {
        return {
            restrict: 'A',
            scope: true,
            link: imagesLoadedLink
        };
    });

function ctrlThumbs($scope) {
}

function ctrlMain($scope, cornercouch, $routeParams, ejsResource, $location) {
    console.log(arguments);
    var ejs          = ejsResource('/search');

    $scope.searchNoHits = false;
    $scope.qs        = '';
    $scope.appending = true;
    $scope.rows      = [];
    $scope.filters = [];

    $scope.start     = 1;
    $scope.server    = cornercouch();
    $scope.tumblr    = $scope.server.getDB($scope.dbName || 'tumblr');
    $scope.root      = '/';
    $scope.selected  = null;

    if ((/.*\/_design\/.*/).test(document.location)) {
        $scope.root = document.location;
    }

    if ($routeParams.site) {

    }

    $scope.query = ejs.Request()
        .indices("pvt2")
        .size(100)
        .facet(ejs.TermsFacet('site')
            .field('site')
            .size(20))
        .facet(ejs.TermsFacet('tag')
            .field('tags')
            .size(20));

    allQuery();


    function updateSearch() {
        var filter = false;

        if ($scope.filters.length === 1) {
            filter = _($scope.filters).chain()
                .map(mapFilters)
                .first()
                .value();
        } else if ($scope.filters.length > 1) {
            filter = ejs.OrFilter(
                _($scope.filters).map(mapFilters)
            );
        } else {
            filter = ejs.MatchAllFilter();
        }


        $scope.rows = [];
        $scope.start = 1;
        $scope.appending = true;

        $scope.query = $scope.query.filter(filter);
       
        $scope.query.doSearch().then(appendRows);

        function mapFilters(filter) {
            return ejs.TermFilter(filter.facet, filter.value);
        }
    }


    function allQuery() {
        $scope.query = $scope.query
            .query(ejs.MatchAllQuery());

        $scope.query.doSearch()
            .then(appendRows);
    }

    $scope.facets = {};

    function toggleFavorite(index) {
        $scope.rows[index].favorite = true;
    }

    function appendRows(results) {
        if (results.hits.total) {
            $scope.total = results.hits.total;
            $scope.searchNoHits = false;
            $scope.facets = results.facets;
            var newRows = _(results.hits.hits || []).pluck('_source');
            $scope.rows = $scope.rows.concat(newRows);
            setTimeout(function() {
                $scope.appending = false;
            }, 1000);
        } else {
            $scope.searchNoHits = true;
        }

    }

    $scope.search = function(qs) {
        if (qs.length) {
            $scope.qs = angular.copy(qs);
            $scope.rows = [];
            $scope.start = 0;

            $scope.query = $scope.query.query(ejs.QueryStringQuery($scope.qs));
            $scope.query.doSearch()
                .then(appendRows);
        }
    };

    $scope.startHere = function() {
        $scope.start = $scope.start + $scope.rows.length - 100;
        $scope.appending = false;
        $scope.rows = [];

        $scope.loadNext();
    };

    $scope.loadNext = function() {
        if (!$scope.appending) {
            $scope.appending = true;
            var from = $scope.start + $scope.rows.length; 
            $scope.query = $scope.query.from(from);

            $scope.query.doSearch()
                .then(appendRows);
        }
    };

    
    $scope.toggleFilter = function(facet, value) {
        var obj = {facet: facet, value: value};

        var where = _($scope.filters).findWhere(obj);

        if (where) {
            $scope.filters = _($scope.filters).without(where);
        } else {
            $scope.filters.push(obj);
        }
        updateSearch();
    };

    $scope.isFilter = function(facet, value) {
        var obj = {facet: facet, value: value};
        return !!_($scope.filters).findWhere(obj);
    };

    $scope.keyDown = function($event) {
        if ($event.which === 32) {
            toggleFavorite(fuckingGlobal);
        }
    };

}

//ctrlMain.$inject = ['$scope', '$routeParams', '$location'];

function magnificPopupLink(scope, element, attrs) {

    scope.$watch('rows', function() {
        $(element).magnificPopup({
            type: 'image',
            verticalFit: true,
            delegate: 'a',
            preload: [1,2],
            gallery: {
                enabled: true
            },
            callbacks: {
                open: function() {
                    fuckingGlobal = this.index;
                },
                change: function() {
                    fuckingGlobal = this.index;
                },
                close: function() {
                    fuckingGlobal = null;
                }
            }
        });
    });
}

function imagesLoadedLink(scope, element, attrs) {
    scope.$watch('rows', function() {
        imagesLoaded(element, function() {
            $(element).masonry('layout');
        });
    });
}
