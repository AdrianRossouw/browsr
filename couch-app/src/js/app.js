/* jshint unused:false */

angular.module('tumblr-browsr', ['CornerCouch', 'wu.masonry', 'infinite-scroll', 'ui.bootstrap']);

function ctrlThumbs($scope, cornercouch, $modal, $log) {
    $scope.firstRecord = 5000;

    $scope.selectedIndex = -1; // Whatever the default selected index is, use -1 for no selection
    $scope.rows = [];
    $scope.server = cornercouch();
    $scope.tumblr = $scope.server.getDB($scope.dbName || 'tumblr');
    $scope.tumblr.queryAll({
        include_docs: true,
        descending:true,
        limit: 100
        //skip: $scope.firstRecord
    }).then(appendRows);

    function appendRows() {
        $scope.rows = $scope.rows.concat($scope.tumblr.rows);
        $('#masonry-ctrl').masonry('layout');
    }

    $scope.$watch($scope.tumblr, function() {
    });

    $scope.select = function($index) {
        if ($scope.selectedIndex === $index) {
            $scope.selectedIndex = -1;
        } else {
            $scope.selectedIndex = $index;
        }
    };

    $scope.$watch('selectedIndex', function() {
        if ($scope.selectedIndex != -1) {
            $scope.open($scope.selectedIndex);
        }
    });

    $(document).keydown($scope.handleKey);
    $scope.handleKey = function($event) {
        $event.preventDefault();
        if (~$scope.selectedIndex) { return false; }

        if ($event.keyCode == 37) {
            $scope.selectedIndex--;
        } else if ($event.keyCode == 39) {
            $scope.selectedIndex++;
        }
    };

    $scope.prevClick = function() { $scope.tumblr.queryPrev(); };
    $scope.nextClick = function() { $scope.tumblr.queryNext().then(appendRows); };

    $scope.open = function () {

        var modalInstance = $modal.open({
            templateUrl: 'mymodal.html',
            controller: ModalInstanceCtrl,
            resolve: {
                tumblr: function () {
                    return $scope.tumblr;
                },
                selectedIndex: function() {
                    return $scope.selectedIndex;
                }
            }
        });

        modalInstance.result.then(function () {
            $scope.selectedIndex = -1;
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

}

var ModalInstanceCtrl = function ($scope, $modalInstance, tumblr, selectedIndex) {

    $scope.tumblr = tumblr;
    $scope.selectedIndex = selectedIndex;

    $scope.selected = tumblr.getQueryDoc(selectedIndex);

    $scope.ok = function () {
        $modalInstance.close($scope.selectedIndex);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};
