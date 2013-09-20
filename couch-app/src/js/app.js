/* jshint unused:false */

angular.module('tumblr-browsr', ['CornerCouch', 'wu.masonry']);

function ctrlThumbs($scope, cornercouch) {
    
    $scope.server = cornercouch();
    $scope.tumblr = $scope.server.getDB("tumblr");
    $scope.tumblr.queryAll({ include_docs: true, descending:true});

    $scope.selectedIndex = -1; // Whatever the default selected index is, use -1 for no selection

    $scope.itemClicked = function ($index, $event) {
        $scope.selectedIndex = $index;
        setTimeout(function() {$($event.target).parents('#masonry-ctrl').masonry('layout');}, 200);
    };


}

