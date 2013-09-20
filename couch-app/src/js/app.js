

angular.module('tumblr-browsr', ['CornerCouch']);

function ctrlThumbs($scope, cornercouch) {
    
    $scope.server = cornercouch();
    $scope.tumblr = $scope.server.getDB("tumblr");
    $scope.tumblr.queryAll({ include_docs: true, descending: true, limit: 30 });
    $scope.detail = $scope.tumblr.newDoc();
    $scope.setDoc = function(idx) {
        $score.detail = $scope.tumblr.getQueryDoc(idx);
    };
}

