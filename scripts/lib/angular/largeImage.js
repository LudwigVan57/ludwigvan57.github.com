(function () {
    var container, imageContainer, toolContainer, closeTool;

    var curIndex;

    var curImage;

    var size;

    var speed;

    var StatusEnum = {
        NORMAL: 1,//普通状态
        TRANSITION: 2,//图片切换状态
        ANIMATION: 3,//图片惯性滑动状态
        IMG_ZOOM: 4//图片非原始尺寸状态
        /* IMG_SCALE_CHANGE:5,//图片尺寸大小改变状态
         IMG_POS_CHANGE:6//图片显示位置改变状态*/
    };

    var DBCLICK_THRESHOLD = 300;

    var curStatus = StatusEnum.NORMAL;

    var lastTouches = [];

    var curShift = 0, curX = 0, curY = 0, curScale = 1;

    //var lastTouchX;

    var windowWidth;

    var touchMoveTime, touchEndTime;

    var matArray = [1,0,0,1,0,0];

    //styles
    var containerStyle = "position: fixed;top:0;left:0;width: 100%;height: 100%;background: #000000;z-index: 1000;",
        ulStyle = "display: -webkit-box;-webkit-box-orient: horizontal;height: 100%;width:100%;",
        liStyle = "display: block;height: 100%;width:100%;",
        imgBoxStyle = "-webkit-transform-origin:50% 50%;transform-origin:50% 50%;display: -webkit-box;-webkit-box-align: center;-webkit-box-pack: center;height: 100%;width:100%;",
        imgStyle = "display: block;max-width: 100%;max-height: 100%;",
        toolStyle = "position: absolute;top: 0;left: 0;width: 100%;height: 40px;background:rgba(0,0,0,0.66);text-align: center;line-height: 40px;",
        closeToolStyle = "position: absolute;right: 0;color: #E2E2E2;width: 40px;font-size: 25px;";

    function createContainer() {
        container = angular.element("<div style='" + containerStyle + "'></div>");
        imageContainer = angular.element("<ul style='" + ulStyle + "'></ul>");
        toolContainer = angular.element("<div style='" + toolStyle + "'></div>");
        closeTool = angular.element("<div style='" + closeToolStyle + "'>\u2715</div>");

        angular.element(document.body).append(container);
        container.append(imageContainer);
        container.append(toolContainer);
        toolContainer.append(closeTool);

        closeTool.on("touchend", close);
        container.on("touchstart", touchStart);
        container.on("touchmove", touchMove);
        container.on("touchend", touchEnd);
    }

    function close() {
        container.css("display", "none");
    }

    function open() {
        toolContainer.css("display", "none");
        container.css("display", "block");
    }
    function touchStart(e) {
        windowWidth = window.innerWidth;

        touchMoveTime = e.timeStamp;

        setShift(windowWidth * curIndex);

        curImage = imageContainer.children().eq(curIndex).children();
        e.preventDefault();

        lastTouches = e.touches;
    }

    function touchMove(e) {
        if (curStatus !== StatusEnum.ANIMATION) {
            var touches = e.touches;

            if (touches.length === 1) {
                var touch = touches[0],
                    lastTouch = lastTouches[0];
                if (curStatus === StatusEnum.IMG_ZOOM) {
                    var xChange = lastTouch.pageX - touch.pageX,
                        yChange = lastTouch.pageY - touch.pageY;

                    matTranslate(curX - xChange, curY - yChange, curScale);
                    matExcute();
                } else {
                    curStatus = StatusEnum.TRANSITION;

                    var shiftChange = lastTouch.pageX - touch.pageX;

                    setShift(curShift + shiftChange);

                    speed = shiftChange / (e.timeStamp - touchMoveTime);

                    touchMoveTime = e.timeStamp;
                }
            } else if (touches.length === 2) {
                if (curStatus === StatusEnum.IMG_ZOOM || curStatus === StatusEnum.NORMAL) {
                    curStatus = StatusEnum.IMG_ZOOM;

                    var touchA1 = lastTouches[0], touchA2 = lastTouches[1],
                        touchB1 = touches[0], touchB2 = touches[1];

                    var dA = distanceBetweenTouches(touchA1, touchA2),
                        dB = distanceBetweenTouches(touchB1, touchB2),
                        aX = (touchA1.pageX + touchA2.pageX) / 2,
                        aY = (touchA1.pageY + touchA2.pageY) / 2,
                        bX = (touchB1.pageX + touchB2.pageX) / 2,
                        bY = (touchB1.pageY + touchB2.pageY) / 2,
                        xChange = bX - aX,
                        yChange = bY - aY;
                    var scaleChange = dB / dA;
                    matZoom(scaleChange);
                    matTranslate(xChange, yChange);
                    matExcute();
                }
            }

            lastTouches = touches;
        } else {
            lastTouches = e.touches;
        }
    }

    function touchEnd(e) {
        if (curStatus !== StatusEnum.ANIMATION) {
            var touches = e.touches;

            if (touches.length === 0) {
                if (curStatus === StatusEnum.TRANSITION) {
                    var shiftChange = (curShift - windowWidth * curIndex) / windowWidth;

                    var target;

                    if (shiftChange >= 0 && (shiftChange > 0.5 || speed > 0.5)) {
                        target = Math.min(curIndex + 1, size - 1);
                    } else if (shiftChange < 0 && (shiftChange < -0.5 || speed < -0.5)) {
                        target = Math.max(curIndex - 1, 0);
                    } else {
                        target = curIndex;
                    }

                    goTo(target);
                } else if (curStatus === StatusEnum.NORMAL) {
                    toggleTool();
                } else if (curStatus === StatusEnum.IMG_ZOOM) {
                    fixTransform();
                }

                if ((e.timeStamp - touchEndTime) < DBCLICK_THRESHOLD) {
                    matArray = [1,0,0,1,0,0];
                    matExcute();
                    curStatus = StatusEnum.NORMAL;
                }
                touchEndTime = e.timeStamp;
            }
            lastTouches = touches;
        } else {
            lastTouches = e.touches;
        }
    }

    function fixTransform() {
        var scale = matArray[0];


        if (scale < 1) {
            curStatus = StatusEnum.ANIMATION;
            matArray = [1,0,0,1,0,0];
            animateTo(curImage, matArray, function () {
                curStatus = StatusEnum.NORMAL;
            });
        } else {
            var img = curImage.children()[0];

            var winWidth = window.innerWidth,
                winHeight = window.innerHeight,
                imgWidth = img.clientWidth,
                imgHeight = img.clientHeight,
                maxWidthScale = winWidth / imgWidth,
                maxHeightScale = winHeight / imgHeight;

            var offsetX = matArray[4],
                offsetY = matArray[5];

            var toLeft = offsetX + winWidth / 2 - imgWidth * scale / 2,
                toRight = -offsetX + winWidth / 2 - imgWidth * scale / 2,
                toTop = offsetY + winHeight / 2 - imgHeight * scale / 2,
                toBottom = -offsetY + winHeight / 2 - imgHeight * scale / 2;

            if (scale < maxWidthScale) {
                matArray[4] = 0;
                toLeft = toRight = 0;
            } else if (scale < maxHeightScale) {
                matArray[5] = 0;
                toTop = toBottom = 0;
            }

            if (toTop > 0) {
                matArray[5] -= toTop;
            } else if (toBottom > 0) {
                matArray[5] += toBottom;
            }

            if (toLeft > 0) {
                matArray[4] -= toLeft;
            } else if (toRight > 0) {
                matArray[4] += toRight;
            }

            if(matArray[4]!==offsetX || matArray[5]!==offsetY){
                curStatus = StatusEnum.ANIMATION;
                animateTo(curImage, matArray, function () {
                    curStatus = StatusEnum.NORMAL;
                });
            }
        }
    }

    function distanceBetweenTouches(touch1, touch2) {
        var sX = touch1.pageX - touch2.pageX,
            sY = touch1.pageY - touch2.pageY;
        return Math.sqrt(sX * sX + sY * sY);
    }

    function goTo(index) {
        curStatus = StatusEnum.ANIMATION;
        imageContainer.css("webkitTransition", "-webkit-transform 300ms");

        imageContainer.on("webkitTransitionEnd", function () {
            curStatus = StatusEnum.NORMAL;
            imageContainer.css("webkitTransition", "");
            imageContainer.off("webkitTransitionEnd");
            setShowImage(index);
        });

        setShift(index*window.innerWidth);
    }

    function setShowImage(index) {
        imageContainer.css("webkitTransform", "translate3d(" + (-index) + "00%,0px,0px)");
        curIndex = index;
    }

    function setShift(shift) {
        curShift = shift;
        imageContainer.css("webkitTransform", "translate3d(" + (-shift) + "px,0px,0px)");
    }

    function matExcute() {
        setMatrix(curImage, matArray);
    }

    function animateTo(el, mat, callback) {
        el.css("webkitTransition", "-webkit-transform 300ms");

        setMatrix(el, mat);

        el.on("webkitTransitionEnd", function () {
            el.css("webkitTransition", "");
            el.off("webkitTransitionEnd");
            callback && callback();
        });
    }

    function matTranslate(shiftX, shiftY) {
        matMultiply([1, 0, 0, 1, shiftX, shiftY]);
    }

    function matZoom(scale) {
        matMultiply([scale, 0, 0, scale, 0, 0]);
    }

    function matMultiply(array) {
        var a = matArray[0], b = matArray[1], c = matArray[2], d = matArray[3], e = matArray[4], f = matArray[5];

        var a1 = array[0], b1 = array[1], c1 = array[2], d1 = array[3], e1 = array[4], f1 = array[5];

        matArray[0] = a1 * a + c1 * b;
        matArray[1] = b1 * a + d1 * b;
        matArray[2] = a1 * c + c1 * d;
        matArray[3] = b1 * c + d1 * d;
        matArray[4] = a1 * e + c1 * f + e1;
        matArray[5] = b1 * e + d1 * f + f1;
    }

    function setMatrix(el, mat) {
       // matrix(a,b,c,d,e,f)与matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1)的结果相同。
        el.css("webkitTransform", "matrix3d(" +
            mat[0] + "," + mat[1] + ",0,0," +
            mat[2] + "," + mat[3] + ",0,0," +
            "0,0,1,0,"+
            mat[4] + "," + mat[5] + ",0,1)");
    }

    function toggleTool() {
        var display = toolContainer.css("display");
        toolContainer.css("display", display === "none" ? "block" : "none");
    }

    angular.module('largeImage', [])
        .directive('limage', function ($rootScope) {
            return {
                restrict: "A",
                link: function (scope, element, attrs, ctrl) {
                    element.on('click', function (e) {
                        var url = scope.$eval(attrs.limage);

                        size = 1;

                        if (!container) {
                            createContainer();
                        }

                        open();

                        setShowImage(0);

                        var imageHtml = "<li style='" + liStyle + "'>" +
                            "<div class='imgBox' style='" + imgBoxStyle + "'>" +
                            "<img style='" + imgStyle + "' src='" + url + "'></div></li>";
                        imageContainer.html(imageHtml);
                    });
                }
            };
        })
        .directive('multiLimage', function ($rootScope) {
            return {
                restrict: "A",
                link: function (scope, element, attrs, ctrl) {
                    var statementReg = /^(\S+) +path +(\S+) +for +(\S+) +in +(\S+)$/;

                    element.on('click', function (e) {
                        var statement = attrs.multiLimage;

                        var mat = statement.match(statementReg);
                        if (!mat) return;

                        var pathMat = mat[2],
                            itemMat = mat[3],
                            array = scope.$eval(mat[4]);

                        size = array.length;


                        var tempScope = scope.$new();

                        if (!container) {
                            createContainer();
                        }

                        //打开图片容器
                        open();

                        setShowImage(Number(scope.$eval(mat[1])));

                        //设置图片列表的html
                        var imageHtml = "";
                        angular.forEach(array, function (cur) {
                            tempScope[itemMat] = cur;
                            var path = tempScope.$eval(pathMat);

                            imageHtml += "<li style='" + liStyle + "'>" +
                                "<div class='imgBox' style='" + imgBoxStyle + "'>" +
                                "<img style='" + imgStyle + "' src='" + path + "'></div></li>";
                        });
                        imageContainer.html(imageHtml);

                        tempScope.$destroy();
                    });
                }
            };
        });

})();