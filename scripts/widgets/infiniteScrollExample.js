'use strict';

var app = angular.module('infiniteScrollExampleApp', [
    'infiniteScroll'
]);

app.controller('infiniteScrollExampleCtrl', function($scope,$timeout) {

    var pageSize = 20;

    function getDataByPageNum(pageNum){
        var data = [];
        for(var i=0;i<pageSize;i++){
            data.push({value:'这是第 '+pageNum+' 页, 第 '+(i+1)+' 条数据'});
        }

        return data;
    }

    $scope.infinite = {
        nextPage: function () {
            var inf = this;

            $timeout(function(){
                inf.end(getDataByPageNum(inf.pageNum));
            },300);
        }
    };

});