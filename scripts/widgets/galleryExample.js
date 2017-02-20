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

    var isMobile = !!(new MobileDetect(window.navigator.userAgent).mobile());
    if(!isMobile){
        alert('请在手机上打开！');
    }
});