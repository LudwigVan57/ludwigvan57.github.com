'use strict';

var app = angular.module('galleryExampleApp', [
    'largeImage'
]);

app.controller('galleryExampleCtrl', function($scope) {
    $scope.images = [
        {imgUrl:'../images/widgets/1.jpeg'},
        {imgUrl:'../images/widgets/2.jpeg'},
        {imgUrl:'../images/widgets/3.jpeg'}
    ];


});