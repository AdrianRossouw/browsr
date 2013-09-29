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
            .when('/:count', {})
            .otherwise({redirectTo: '/'});

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

    var ejs             = ejsResource('/search');

    $scope.$routeParams = $routeParams;
    $scope.searchNoHits = false;
    $scope.qs           = '';
    $scope.appending    = true;
    $scope.rows         = [];
    $scope.facets       = {};
    $scope.start        = $cookieStore.get('start') || 1;
    $scope.server       = cornercouch();
    $scope.db           = $scope.server.getDB('api');
    $scope.root         = '/';
    $scope.selected     = null;

    if ((/.*\/_design\/.*/).test(document.location)) {
        $scope.root = document.location;
    }

    console.log(location);
    $scope.filters = $cookieStore.get('filters') || [];

    var termFacets = {
        site: ejs.TermsFacet('site')
            .field('site')
            .size(40),
        tags: ejs.TermsFacet('tags')
            .field('tags')
            .size(25),
        date: ejs.DateHistogramFacet('date')
            .keyField('date')
            .interval('month')
    };

    $scope.query = ejs.Request()
        .indices("pvt2")
        .size(100)
        .from($scope.start)
        .facet(termFacets.site)
        .facet(termFacets.tags)
        //.facet(termFacets.date)
        .sort(ejs.Sort('date').desc());

    allQuery();

    updateSearch();

    function updateSearch() {
        $(document).scrollTop(0);

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
                priority: filter.priority || 'must'
            };
        }
    }


    function allQuery() {
        $scope.query = $scope.query
            .query(ejs.MatchAllQuery());

    }

    $scope.resetAll = function() {
        $scope.filters = [];
        $cookies.filters = $scope.filters;
        $cookieStore.put('filters', $scope.filters);
        setStart(1);
        updateSearch();
    };

    function appendRows(results) {
        if (results.hits.total) {
            $scope.total = results.hits.total;
            $scope.searchNoHits = false;
            $scope.facets = results.facets;
            var newRows = _(results.hits.hits || []).chain()
                .pluck('_source')
                .map(imageMapFn)
                .value();
            $scope.rows = $scope.rows.concat(newRows);
        } else {
            $scope.searchNoHits = true;
        }

        $scope.appending = false;

        function imageMapFn(obj) {
            obj.images = _(obj.images).chain()
                .map(function(img) { img.id = obj._id; return img; })
                .groupBy('maxWidth')
                .value();
            return obj;
        }
    }

    $scope.search = function(qs) {
        if (qs.length) {
            $scope.qs = angular.copy(qs);
            $scope.rows = [];
            setStart(0);

            $scope.query = $scope.query.query(ejs.QueryStringQuery($scope.qs));
            $scope.query.doSearch()
                .then(appendRows);
        }
    };

    function setStart(start) {
        $scope.start = start;
        $cookieStore.put('start', start);
    }

    $scope.startHere = function() {
        setStart($scope.start + $scope.rows.length - 100);
        $scope.appending = false;
        $scope.rows = [];

        $(document).scrollTop(0);
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
        setStart(1);
        updateSearch();
    };

    $scope.isFilter = function(facet, value) {
        var obj = {facet: facet, value: value};
        return !!_($scope.filters).findWhere(obj);
    };
 
    function toggleFavorite(id) {
        if (!id) { return false; }

        var where = _($scope.rows).findWhere({id: id});

        var newState = !where.favorite;
        where.favorite = newState;

        var doc = $scope.db.newDoc();

        doc.load(id).then(function(data) {
            doc.favorite = newState;
            doc.save();
        }, function(err) {
            console.log('error', err);
        });
    }

    $scope.mouseDown = function($event) {
        if ($event.which === 3) {
            $event.preventDefault();

            var index = false;

            if (fuckingGlobal === null) {
                index = $($event.target).attr('data-index');
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
                    fuckingGlobal = this.st.el.find('img').attr('data-index');
                },
                change: function() {
                    fuckingGlobal = this.st.el.find('img').attr('data-index');
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
