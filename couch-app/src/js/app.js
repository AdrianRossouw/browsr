/* jshint unused:false */




angular.module('tumblr-browsr', ['CornerCouch', 'wu.masonry', 'infinite-scroll'])
    .directive('magnificPopup', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                $(element).magnificPopup({
                    type: 'image',
                    delegate: 'span.magnific-open',
                    verticalFit: false,
                    gallery: {
                        enabled: true
                    }

                });
            }
        };
    });



function ctrlThumbs($scope, cornercouch, $log) {

    $scope.appending = true;
    $scope.selectedIndex = -1; // Whatever the default selected index is, use -1 for no selection
    $scope.rows = [];
    $scope.server = cornercouch();
    $scope.tumblr = $scope.server.getDB($scope.dbName || 'tumblr');


    function appendRows() {
        $scope.appending = false;
        $scope.rows = $scope.rows.concat($scope.tumblr.rows);
        $('#masonry-ctrl').masonry('layout');
    }

    $scope.tumblr.queryAll({
        include_docs: true,
        descending:true,
        limit: 200
    }).then(appendRows);

    $scope.select = function($index) {
        if ($scope.selectedIndex === $index) {
            $scope.selectedIndex = -1;
        } else {
            $scope.selectedIndex = $index;
        }
    };

    $scope.loadNext = function() {
        if (!$scope.appending && $scope.tumblr.nextRow) {
            $scope.appending = true;
            $scope.tumblr.queryNext().then(appendRows);
        }
    };

}

