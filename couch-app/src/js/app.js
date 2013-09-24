/* jshint unused:false */
document.oncontextmenu= function() { return false; };
var fuckingGlobal = null;

var app = angular.module('tumblrBrowsr', [
    'CornerCouch', 'wu.masonry', 'infinite-scroll',
    'ngRoute', 'ngCookies', 'elasticjs.service'
    ])
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/site/:site', {})
            .when('/tag/:tag', {})
            .when('/likes', {})
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

function ctrlMain( $scope, cornercouch, $routeParams,
    ejsResource, $location, $cookies,  $cookieStore) {

    var ejs          = ejsResource('/search');

    $scope.searchNoHits = false;
    $scope.qs        = '';
    $scope.appending = true;
    $scope.rows      = [];

    $scope.start     = 1;
    $scope.server    = cornercouch();
    $scope.db        = $scope.server.getDB('api');
    $scope.root      = '/';
    $scope.selected  = null;

    if ((/.*\/_design\/.*/).test(document.location)) {
        $scope.root = document.location;
    }

    $scope.filters = $cookieStore.get('filters') || [];

    var termFacets = {
        site: ejs.TermsFacet('site')
            .field('site')
            .size(20),
        tags: ejs.TermsFacet('tags')
            .field('tags')
            .size(20)
    };

    $scope.query = ejs.Request()
        .indices("pvt2")
        .size(100)
        .facet(termFacets.site)
        .facet(termFacets.tags);

    allQuery();

    updateSearch();

    function updateSearch() {
        var filter = ejs.BoolFilter();

        var mapped = _($scope.filters).map(mapFilters);


        if ($scope.filters.length === 1) {
            filter = filter.must(_(mapped).first().filter);
        } else if ($scope.filters.length > 1) {
            filter = _(mapped).reduce(reduceMappedFilters, filter);
        } else {
            filter = ejs.MatchAllFilter();
        }


        $scope.rows = [];
        $scope.start = 1;
        $scope.appending = true;

        termFacets.site.facetFilter(filter);
        termFacets.tags.facetFilter(filter);
        $scope.query = $scope.query.filter(filter);

        $scope.query.doSearch().then(appendRows);

        function reduceMappedFilters(filter, mapped) {
            filter[mapped.priority](mapped.filter);
            return filter;
        }

        function mapFilters(filter) {
            return {
                filter: ejs.TermFilter(filter.facet, filter.value),
                priority: filter.priority || 'should'
            };
        }
    }


    function allQuery() {
        $scope.query = $scope.query
            .query(ejs.MatchAllQuery());

    }

    $scope.facets = {};

    
    function toggleFavorite(index) {
        if (!index) { return false; }

        var newState = !$scope.rows[index].favorite;
        $scope.rows[index].favorite = newState;

        var id = $scope.rows[index].id;
        var doc = $scope.db.newDoc();

        doc.load(id).then(function(data) {
            doc.favorite = newState;
            doc.save();
        }, function(err) {
            console.log('error', err);
        });


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

    
    $scope.toggleFilter = function(facet, value, priority) {
        var obj = {facet: facet, value: value};
        var where = _($scope.filters).findWhere(obj);

        if (priority) { obj.priority = priority; }

        if (where) {
            $scope.filters = _($scope.filters).without(where);
        } else {
            $scope.filters.push(obj);
        }
        $cookies.filters = $scope.filters;
        $cookieStore.put('filters', $scope.filters);
        updateSearch();
    };

    $scope.isFilter = function(facet, value) {
        var obj = {facet: facet, value: value};
        return !!_($scope.filters).findWhere(obj);
    };

    $scope.mouseDown = function($event) {
        if ($event.which === 3) {
            $event.preventDefault();

            var index = false;

            if (fuckingGlobal === null) {
                index = parseInt($($event.target).attr('data-index'), 10);
            } else {
                index = fuckingGlobal;
            }

            if (index) { toggleFavorite(index); }
        }
    };
    $scope.keyDown = function($event) {
        if ($event.which === 32) {
            toggleFavorite(fuckingGlobal);
        }
    };

}

//ctrlMain.$inject = ['$scope', '$routeParams', '$location', '$cookies', '$cookieStore'];

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
