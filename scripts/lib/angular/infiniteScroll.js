angular.module('infiniteScroll', [])

    .directive('infinite', ["$parse",function ($parse) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                /**
                 * 显示数据条数，该数值的数据高度必须远大于showDataScreenNum屏数的高度
                 * zhege
                 * @type {number}
                 */
                var showDataSize = 120;

                /**
                 * 显示数据屏数
                 * @type {number}
                 */
                var showDataScreenNum = 4;

                var infinite = angular.extend({
                    data:[],
                    pageNum:0,
                    isAbandon :false,
                    scrollBar:"window",
                    threshold:20,
                    end: function (newData) {
                        this.pageNum++;
                        inDataFetching = false;

                        var array = this.data;
                        angular.forEach(newData,function(data){
                            array.push(data);
                        });
                    },
                    abandon:function(){
                        inDataFetching = false;
                        this.isAbandon = true;
                    },
                    /**
                     * @function
                     */
                    nextPage:null,
                    reload:function(){
                        inDataFetching = false;
                        this.isAbandon = false;
                        this.pageNum = 1;
                        this.data = [];
                        this.nextPage();
                    },
                    _showData : {
                        showDataStart:0,
                        showDataEnd:showDataSize
                    }
                },scope.$eval(attrs.infinite));


                var model = $parse(attrs.infinite);
                model.assign(scope,infinite);

                var inDataFetching = false;

                var scrollBar = infinite.scrollBar==="window"?window:document.documentElement.querySelector(infinite.scrollBar);

                var screenSize = Math.max(window.innerHeight,window.innerWidth);

                var screenArea = screenSize*4;

                var screenAreaStart = 0;

                var screenAreaEnd= screenArea;


                function getScrollTop(){
                    return scrollBar===window?document.body.scrollTop:scrollBar.scrollTop;
                }

                function setScrollTop(scrollTop){
                    if(scrollBar===window){
                        document.body.scrollTop = scrollTop;
                    }else{
                        scrollBar.scrollTop = scrollTop;
                    }
                }

                function isBottom() {
                    if (scrollBar === window) {
                        return (document.body.scrollTop + document.documentElement.clientHeight + infinite.threshold) > document.body.scrollHeight;
                    } else {
                        return (scrollBar.scrollTop + scrollBar.clientHeight + infinite.threshold) > scrollBar.scrollHeight;
                    }
                }

                function optimize(){
                    var scrollTop = getScrollTop();
                    if(scrollTop<screenAreaStart || scrollTop>screenAreaEnd){
                        computeDataNumArea(scrollTop);
                        scope.$digest();
                    }
                }

                function computeScreenArea(scrollTop){
                    screenAreaStart = scrollTop-screenArea/2;
                    screenAreaEnd = screenAreaStart+screenArea;
                }

                function computeDataNumArea(scrollTop){
                    var unlistTop = scrollBar===window?0:scrollBar.offsetTop,
                        list = element.children(),
                        start = infinite._showData.showDataStart,
                        centerPos,
                        centerEl,
                        centerIndex;

                    for(var i = 0,length = list.length;i<length;i++){
                        var child = list[i],
                            pos = child.offsetTop-unlistTop-scrollTop;

                        if(centerPos===undefined){
                            centerPos = pos;
                            centerEl = child;
                            centerIndex = start+i;
                        }else if(Math.abs(pos)<Math.abs(centerPos)){
                            centerPos = pos;
                            centerEl = child;
                            centerIndex = start+i;
                        }else{
                            break;
                        }
                    }

                    infinite._showData.showDataStart = Math.max(parseInt(centerIndex-showDataSize/2),0);
                    infinite._showData.showDataEnd = infinite._showData.showDataStart+showDataSize;

                    setTimeout(function(){
                        var curScrollTop = getScrollTop(),
                            newPos = centerEl.offsetTop-unlistTop-curScrollTop,
                            newScrollTop = curScrollTop+newPos-centerPos;

                        setScrollTop(newScrollTop);
                        computeScreenArea(newScrollTop);
                    },5);

                    /*console.log("compute:  "+centerIndex+"  "+ scope._infinite.showDataStart
                        +"  "+ scope._infinite.showDataEnd);*/
                }

                function scroll() {
                    if (inDataFetching || infinite.isAbandon) {
                        return;
                    }

                    optimize();

                    if (isBottom()) {
                        inDataFetching = true;
                        infinite.nextPage();
                    }
                }

                scrollBar.addEventListener('scroll', scroll, false);

                element.on('$destroy', function () {
                    scrollBar.removeEventListener('scroll',scroll);
                });

                if(!infinite.isAbandon){
                    infinite.reload();
                }
            },
            template:function(element,attrs){
                var children = element.children();

                angular.forEach(children,function(el){
                    var ngRepeatExp = el.getAttribute("ng-repeat");
                    el.setAttribute("ng-repeat",ngRepeatExp+" | infinite:this."+attrs.infinite);
                });
            }
        };
    }])

    .filter('infinite', function() {

        return function(array,infinite) {
            if(array && array.length>0){
                array = array.slice(infinite._showData.showDataStart,infinite._showData.showDataEnd) ;
            }

            infinite.realLength = array.length;
            return array ;
        };
    });