/* jshint unused:false */
document.oncontextmenu= function() { return false; };
var fuckingGlobal = null;

var app = angular.module('tumblrBrowsr', [
    'CornerCouch', 'wu.masonry', 'infinite-scroll',
    'ngRoute', 'ngCookies', 'ngTouch', 'hmTouchEvents',
    'elasticjs.service'
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

    $scope.infinite     = $cookieStore.get('infinite') || false;
    $scope.$routeParams = $routeParams;
    $scope.searchNoHits = false;
    $scope.qs           = '';
    $scope.appending    = true;
    $scope.rows         = [];
    $scope.facets       = {};
    $scope.start        = $cookieStore.get('start') || 1;
    $scope.from         = $scope.start;
    $scope.server       = cornercouch();
    $scope.db           = $scope.server.getDB('api');
    $scope.root         = '/';
    $scope.selected     = null;
    $scope.perPage      = 50;
    $scope.hideSeen     = $cookieStore.get('hideSeen') || false;
    $scope.onlyLikes    = $cookieStore.get('onlyLikes') || false;
    $scope.filters      = $cookieStore.get('filters') || [];

    if ((/.*\/_design\/.*/).test(document.location)) {
        $scope.root = document.location;
    }


    var facets = {
        site: ejs.TermsFacet('site')
            .field('site')
            .size(35),
        tags: ejs.TermsFacet('tags')
            .field('tags')
            .size(20),
        date: ejs.DateHistogramFacet('date')
            .keyField('date')
            .interval('month')
    };

    $scope.query = ejs.Request()
        .indices("pvt2")
        .size($scope.perPage)
        .from($scope.start)
        .facet(facets.site)
        .facet(facets.tags)
        .facet(facets.date)
        .sort(ejs.Sort('timestamp').desc());

    var filterFns = {};

    filterFns.terms = function(filter) {
        return ejs.TermFilter(filter.facet, filter.value);
    };

    filterFns.date_histogram = function(filter) {
        console.log(filter);
        return ejs.RangeFilter(filter.facet)
            .from(filter.value)
            .to(filter.value + '||+1M-1d');
    };

    function updateSearch() {
        $(document).scrollTop(0);

        var filter = ejs.BoolFilter();
        var mapped = _($scope.filters).map(mapFilters);

        if ($scope.onlyLikes) {
            filter = filter.must(ejs.TermFilter('favorite', true));
        } else if ($scope.hideSeen) {
            filter = filter.mustNot(ejs.ExistsFilter('favorite'));
        }

        if ($scope.filters.length === 1) {
            filter = filter.must(_(mapped).first().filter);
        } else if ($scope.filters.length > 1) {
            filter = _(mapped).reduce(reduceMappedFilters, filter);
        } else if (!$scope.hideSeen && !$scope.onlyLikes) {
            filter = ejs.MatchAllFilter();
        }

        $scope.rows = [];
        $scope.appending = true;

        facets.site = facets.site.facetFilter(filter);
        facets.tags = facets.tags.facetFilter(filter);
        facets.date = facets.date.facetFilter(filter);

        $scope.query = $scope.query.filter(filter);

        $scope.query.doSearch().then(appendRows);

        function reduceMappedFilters(filter, mapped) {
            filter[mapped.priority](mapped.filter);
            return filter;
        }

        function mapFilters(filter) {
            return {
                filter: filterFns[filter.type](filter),
                priority: filter.priority || 'must'
            };
        }
    }


    allQuery();

    updateSearch();

    function allQuery() {
        $scope.query = $scope.query
            .query(ejs.MatchAllQuery());

    }

    $scope.resetAll = function() {
        $scope.filters = [];
        $cookies.filters = $scope.filters;
        $cookieStore.put('filters', $scope.filters);
        setInfinite(false);
        setStart(1);
        $scope.from = $scope.start;
        $scope.total = 0;
        updateSearch();
    };

    function appendRows(results) {
        if (results.hits.total) {
            $scope.total = results.hits.total;
            $scope.searchNoHits = false;
            $scope.facets = _(results.facets).reduce(mapFacets, {});
            var newRows = _(results.hits.hits || []).chain()
                .pluck('_source')
                .map(imageMapFn)
                .value();
            $scope.rows = $scope.rows.concat(newRows);
        } else {
            $scope.searchNoHits = true;
        }

        $scope.appending = false;

        function mapFacets(memo, facet, key) {

            if (facet._type === 'date_histogram') {
                facet.terms = _(facet.entries).map(mapEntries);
                facet.total = _(facet.entries).reduce(sumFn, 0);
            }

            if (!facet.total) { return memo; }
            memo[key] = facet;
            return memo;
        }

        function sumFn(memo, obj) {
            return memo + obj.count;
        }
        function mapEntries(entry) {
            return {
                term: $scope.getMonth(parseInt(entry.time, 10)),
                count: entry.count
            };
        }
        function imageMapFn(obj) {
            obj.images = _(obj.images).chain()
                .map(function(img) { img.id = obj._id; return img; })
                .groupBy('maxWidth')
                .value();
            return obj;
        }
    }

    function setInfinite(state) {
        $scope.infinite = state;
        $cookieStore.put('infinite', state);
    }

    $scope.toggleInfinite = function() {
        setInfinite(!$scope.infinite);
    };

    $scope.canNext = function() {
        return ($scope.start + $scope.perPage) < $scope.total;
    };

    $scope.stepNext = function() {
        if ($scope.canNext()) {
            setStart($scope.start + $scope.perPage);
            $scope.from = $scope.start;
            var from =  $scope.start;

            $scope.appending = false;
            $scope.rows = [];

            $(document).scrollTop(0);
            if ($scope.hideSeen) {
                // hide the results already seen
                // so we don't page over new results.
                from = from - seenRows();
            }


            loadRecords(from);
        }
    };

    $scope.seenClass = function() {
        if ($scope.onlyLikes) {
            return 'disabled';
        }
        return $scope.hideSeen ? 'active' : '';
    };

    $scope.toggleSeen = function() {
        if (!$scope.onlyLikes) {
            $scope.hideSeen = !$scope.hideSeen;
            $cookieStore.put('hideSeen', $scope.hideSeen);
            setStart(1);
            $scope.from = $scope.start;
            updateSearch();
        }
    };

    $scope.toggleOnlyLikes = function() {
        if (!$scope.hideSeen) {
            $scope.onlyLikes = !$scope.onlyLikes;
            $cookieStore.put('onlyLikes', $scope.onlyLikes);
            setStart(1);
            $scope.from = $scope.start;
            updateSearch();
        }
    };

    $scope.likeClass = function() {
        if ($scope.hideSeen) {
            return 'disabled';
        }
        return $scope.onlyLikes ? 'active' : '';
    };


    $scope.canBack = function() {
       return ($scope.start - $scope.perPage) >= 1;
    };

    $scope.stepBack = function() {
        if ($scope.canBack()) {
            setStart($scope.start - $scope.perPage);
            $scope.from = $scope.start;
            $scope.appending = false;
            $scope.rows = [];

            $(document).scrollTop(0);
            loadRecords($scope.start);
        }
    };

    function setStart(start) {
        if ($scope.total && (start > $scope.total)) {
            start = $scope.total % $scope.perPage;
        }
        $scope.start = start;
        $cookieStore.put('start', start);
    }

    function seenRows() {
        return _($scope.rows).reduce(function(c, r) {
            return _(r).has('favorite') ? c + 1 : c;
        }, 0);
    }

    function loadRecords(from) {
        $scope.appending = true;
        $scope.query = $scope.query.from(from);

        $scope.query.doSearch()
            .then(appendRows);
    }

    $scope.loadInfinite = function() {
        if (!$scope.appending && $scope.infinite) {
            $scope.appending = true;
            if ($scope.canNext()) {
                var from = $scope.start + $scope.rows.length;
                setStart(from);
                if ($scope.hideSeen) {
                    // hide the results already seen
                    // so we don't page over new results.
                    from = from - seenRows();
                }

                loadRecords(from);
            } else {
                $scope.appending = false;
            }
        }
    };


    $scope.toggleFilter = function(facet, value, type, priority) {
        var obj = {facet: facet, value: value};
        var where = _($scope.filters).findWhere(obj);

        if (type) { obj.type = type || 'terms'; }
        if (priority) { obj.priority = priority; }

        if (where) {
            $scope.filters = _($scope.filters).without(where);
        } else {
            $scope.filters.push(obj);
        }
        $cookies.filters = $scope.filters;
        $cookieStore.put('filters', $scope.filters);
        setStart(1);
        $scope.from = $scope.start;
        updateSearch();

    };

    $scope.filterValue = function(facet) {
        var obj = {facet: facet};
        var where = _($scope.filters)
            .findWhere(obj);
        return where ? where.value : '';
    };
    $scope.isFilter = function(facet, value) {
        var obj = {facet: facet};
        if (!_(value).isUndefined) {
            obj.value = value;
        }
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
            doc.favorDate = Date.now();
            doc.save();
        }, function(err) {
            console.log('error', err);
        });
    }

    $scope.mouseDown = function($event) {
        if ($event.which === 3) {
            $event.preventDefault();
            mouseFavorite($event);
        }
    };
    $scope.keyDown = function($event) {
        if ($event.which === 32) {
            toggleFavorite(fuckingGlobal);
        }
    };

    $scope.getMonth = function(d) {
        d = new Date(d);
        function pad(n){return n<10 ? '0'+n : n;}
        return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1);
    };

    function mouseFavorite($event) {

        var index = false;

        if (fuckingGlobal === null) {
            index = $($event.target).attr('data-index');
        } else {
            index = fuckingGlobal;
        }

        if (index) { toggleFavorite(index); }
    }

    $scope.tap = function($event) {
        if ($event.gesture.touches.length === 2) {
            mouseFavorite($event);
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
