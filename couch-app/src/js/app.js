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
            link: function(scope, element, attrs) {
                scope.$watch('rows', function() {
                    //var items = _(scope.rows).map(mapItems);

                    $(element).magnificPopup({
                        type: 'image',
                        verticalFit: false,
                        delegate: 'a',
                        preload: [1,2],
                        //items: items,
                        gallery: {
                            enabled: true
                        }
                    });
                    function mapItems(item, index) {
                        return {
                            title: item.doc.site + ': ' + item.doc.date,
                            src: '/'+scope.dbName+'/'+item.doc.images[0].path
                        };
                    }
                });
            }
        };
    })
    .directive('imagesLoaded', function() {
        return {
            restrict: 'A',
            scope: true,
            link: function(scope, element, attrs) {
                attrs.$observe('imagesLoaded', function() {
                    imagesLoaded(element, function() {
                        $(element).masonry('layout')
                            .find('img').addClass('loaded');
                        attrs.$set('imagesLoadedBusy', false);
                    });

                });
            }
        };
    });



function ctrlThumbs($scope, cornercouch, $log, $routeParams, ejsResource) {

    $scope.appending = true;
    $scope.rows = [];
    $scope.server = cornercouch();
    $scope.tumblr = $scope.server.getDB($scope.dbName || 'tumblr');

    /* instantiate (takes an optional url string) */
    var ejs = ejsResource('http://localhost:9200');

    var query = ejs.Request()
        .indices("pvt2")
        .query(ejs.MatchAllQuery())
        .size(100)
        .facet(ejs.TermsFacet('site')
            .field('site')
            .size(20))
        .facet(ejs.TermsFacet('tag')
            .field('tags')
            .size(20));

    var search = query.doSearch();

    search.then(setFacets);
    search.then(appendRows);

    $scope.facets = {};
    function setFacets(results) {
        $scope.facets = results.facets;
    }

    function appendRows(results) {
        var newRows = _(results.hits.hits || []).pluck('_source');
        $scope.rows = $scope.rows.concat(newRows);
        setTimeout(function() {
            $scope.appending = false;
        }, 1000);
    }

    $scope.loadNext = function() {
        if (!$scope.appending) {
            $scope.appending = true;
            var cnt = $scope.rows.length - 1; 
            query.from(cnt)
                .doSearch()
                .then(appendRows);
        }
    };

}
//ctrlThumbs.$inject = ['$scope', '$routeParams'];
