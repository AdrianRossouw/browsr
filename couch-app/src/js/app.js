/* jshint unused:false */




angular.module('tumblr-browsr', ['CornerCouch', 'wu.masonry', 'infinite-scroll', 'ngRoute', 'elasticjs.service'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/site/:site', {  })
            .when('/tag/:tag', {  })
            .when('/all', {})
            .otherwise({ redirectTo: '/all'});
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

function ctrlThumbs($scope, cornercouch, $log, $routeParams, ejsResource) {
    var ejs          = ejsResource('http://localhost:9200');

    $scope.searchNoHits = false;
    $scope.qs        = '';
    $scope.appending = true;
    $scope.rows      = [];
    $scope.start     = 0;
    $scope.server    = cornercouch();
    $scope.tumblr    = $scope.server.getDB($scope.dbName || 'tumblr');

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

    function allQuery() {
        $scope.query
            .query(ejs.MatchAllQuery())
            .doSearch()
            .then(appendRows);
    }

    $scope.facets = {};

    function appendRows(results) {
        if (result.hits.total) {
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
            $scope.query = $scope.query.query(ejs.QueryStringQuery($scope.qs));

            $scope.query.doSearch()
            .then(appendRows);
        }
    };

    $scope.loadNext = function() {
        if (!$scope.appending) {
            $scope.appending = true;
            var cnt = $scope.rows.length - 1; 
            $scope.query.from(cnt)
                .doSearch()
                .then(appendRows);
        }
    };
}

//ctrlThumbs.$inject = ['$scope', '$routeParams'];

function magnificPopupLink(scope, element, attrs) {
    scope.$watch('rows', function() {
        $(element).magnificPopup({
            type: 'image',
            verticalFit: false,
            delegate: 'a',
            preload: [1,2],
            gallery: {
                enabled: true
            }
        });
    });
}

function imagesLoadedLink(scope, element, attrs) {
    attrs.$observe('imagesLoaded', function() {
        imagesLoaded(element, function() {
            $(element).masonry('layout');
        });
    });
}
