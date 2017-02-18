(function () {
    var IMAGE_PATH = '../images/projects/';

    var lastMouseDownTimeStamp = null;

    var lastMouseDownType = null;

    var draggedTool = null;

    var draggedToolEl = null;

    var EventStateEnum = SvgPanel.EventStateEnum;

    var ToolImgSize = 30;

    var dragCmp = null;

    //当发生拖拽时,用 dragX,dragY 记录起始位置
    var startX = 0;
    var startY = 0;
    var dragX = 0;
    var dragY = 0;

    var $cmpContextMenu;
    var isCmpContextMenuOpened = false;

    var $editedForm;

    var infoWidth;

    var infoMaxWidth = 350;

    function handleSvgEvent(e) {
        var svgCmp = SvgPanel.svgCmp,
            container = SvgPanel.container;

        var containerX = e.pageX - svgCmp.offsetLeft,
            containerY = e.pageY - svgCmp.offsetTop;

        if (containerX >= 0 && containerY >= 0 &&
            containerX <= container.offsetWidth && containerY <= container.offsetHeight) {

            e.svgX = (containerX + container.scrollLeft) * SvgPanel.aspectRatio;
            e.svgY = (containerY + container.scrollTop) * SvgPanel.aspectRatio;
        }

    }

    function svgMouseDown(e) {
        //svg click
        handleSvgEvent(e);

        SvgPanel.eventState = EventStateEnum.SVG_DRAG;

        e.preventDefault();

        var target = e.target;

        if ('cpId' in target) {
            dragCmp = SvgPanel.getCmp(target.cpId);

            startX = dragX = e.svgX;
            startY = dragY = e.svgY;

            SvgPanel.focus(dragCmp);

            if (dragCmp instanceof  LineComponent) {
                if (target.tagName === 'circle') {
                    SvgPanel.focusLinePoint = target.cpIndex;
                } else {
                    SvgPanel.focusLinePoint = null;
                }
            }
        } else {
            SvgPanel.blur();
        }

        //双击监听
        var timeStamp = e.timeStamp;
        if (lastMouseDownTimeStamp && (timeStamp - lastMouseDownTimeStamp) < 300 && lastMouseDownType === e.button) {
            onDoubleClick(e);
        }
        lastMouseDownType = e.button;
        lastMouseDownTimeStamp = timeStamp;
    }

    function toolMouseDown(e) {
        var tool = e.target.dataset.tool;
        if (tool) {
            //tool click
            SvgPanel.eventState = EventStateEnum.TOOL_DRAG;
            startDragToolEl(tool, e.pageX, e.pageY);

            e.preventDefault();
        }
    }

    function infoResizerMouseDown(e) {
        SvgPanel.eventState = EventStateEnum.INFO_RESIZE_DRAG;

        if (!infoWidth) {
            infoWidth = parseInt($(SvgPanel.info).css('width'));
        }

        dragX = e.pageX;


        e.preventDefault();
    }

    function docMouseDown(e) {
        if (e.button == 0 && isCmpContextMenuOpened) {
            $cmpContextMenu.hide();
        }
    }

    function docMouseMove(e) {
        switch (SvgPanel.eventState) {
            case EventStateEnum.SVG_DRAG:
                handleSvgEvent(e);
                svgMouseMove(e);
                e.preventDefault();
                break;
            case EventStateEnum.TOOL_DRAG:
                toolMouseMove(e);
                e.preventDefault();
                break;
            case EventStateEnum.INFO_RESIZE_DRAG:
                infoResizerMouseMove(e);
                e.preventDefault();
                break;
        }
    }

    function docMouseUp(e) {
        switch (SvgPanel.eventState) {
            case EventStateEnum.SVG_DRAG:
                handleSvgEvent(e);

                if (e.button == 2) {
                    svgRightMouseUp(e);
                } else {
                    svgMouseUp(e);
                }
                e.preventDefault();
                break;
            case EventStateEnum.TOOL_DRAG:
                handleSvgEvent(e);

                if (e.svgX) {
                    var cmp = ToolMouseUpHandler[draggedTool](e);

                    SvgPanel.focus(cmp);
                }

                endDragToolEl();
                e.preventDefault();
                break;
        }

        SvgPanel.eventState = EventStateEnum.NORMAL;
    }

    function onDoubleClick(e) {
        var target = e.target;
        if ('cpId' in target) {
            var cmp = SvgPanel.getCmp(target.cpId);
            if (cmp instanceof LineComponent && target.tagName === 'polyline') {
                cmp.addTurnPoint({x: e.svgX, y: e.svgY});
            }
        }
    }

    /**
     * 结束拖拽工具
     */
    function endDragToolEl() {
        draggedTool = null;
        draggedToolEl.style.display = 'none';
    }

    /**
     * 开始拖拽工具
     * @param tool
     * @param x
     * @param y
     */
    function startDragToolEl(tool, x, y) {
        draggedTool = tool;

        var style;
        if (!draggedToolEl) {
            draggedToolEl = document.createElement("img");
            style = draggedToolEl.style;
            style.width = "30px";
            style.height = "30px";
            style.position = "absolute";
            document.body.appendChild(draggedToolEl);
        } else {
            style = draggedToolEl.style;
            style.display = '';
        }

        switch (draggedTool) {
            case "LINE":
                draggedToolEl.src = IMAGE_PATH+"line.png";
                break;
            case "SERVICE":
                draggedToolEl.src = IMAGE_PATH+"service.png";
                break;
            case "FLOW":
                draggedToolEl.src = IMAGE_PATH+"flow.png";
                break;
            case "DECISION":
                draggedToolEl.src = IMAGE_PATH+"decision.png";
                break;
            case "TRANSACTION_BEGIN":
                draggedToolEl.src = IMAGE_PATH+"transactionBegin.png";
                break;
            case "TRANSACTION_COMMIT":
                draggedToolEl.src = IMAGE_PATH+"transactionCommit.png";
                break;
        }

        var offset = ToolImgSize / 2;

        style.left = (x - offset) + "px";
        style.top = (y - offset) + "px";
    }


    function toolMouseMove(e) {
        var style = draggedToolEl.style;

        var offset = ToolImgSize / 2;

        style.left = (e.pageX - offset) + "px";
        style.top = (e.pageY - offset) + "px";
    }

    function infoResizerMouseMove(e) {
        infoWidth -= e.pageX - dragX;

        if (infoWidth > infoMaxWidth) {
            infoWidth = infoMaxWidth;
        }

        if (infoWidth < 5) {
            infoWidth = 5;
        }

        SvgPanel.info.style.width = infoWidth + 'px';

        dragX = e.pageX;

        SvgPanel.container.style.right = (infoWidth + 2) + 'px';

        SvgPanel.resizeSvg();
    }

    function svgMouseMove(e) {
        if (dragCmp) {
            if (!('svgX' in e)) {
                return;
            }

            if (dragCmp instanceof BlockComponent) {
                var x = e.svgX,
                    y = e.svgY;
                dragCmp.x += x - dragX;
                dragCmp.y += y - dragY;
                dragX = x;
                dragY = y;

                $.each(dragCmp.srcLines, function (i, cmp) {
                    cmp.locate();
                });

                $.each(dragCmp.destLines, function (i, cmp) {
                    cmp.locate();
                });
            } else if (dragCmp instanceof LineComponent && SvgPanel.focusLinePoint !== null) {
                var pointIndex = SvgPanel.focusLinePoint;

                var x = e.svgX,
                    y = e.svgY;

                var turnPoint = dragCmp.points[pointIndex];

                turnPoint.x += x - dragX;
                turnPoint.y += y - dragY;
                dragX = x;
                dragY = y;
                dragCmp.locate();
            }
        }
    }

    function svgMouseUp(e) {
        if (dragCmp) {
            if (dragCmp instanceof LineComponent && SvgPanel.focusLinePoint !== null) {
                var lastIndex = dragCmp.points.length - 1;

                if (SvgPanel.focusLinePoint === 0 && !(dragCmp.from instanceof BlockComponent)) {
                    //拖拽第一个

                    var turnPoint = dragCmp.points[0],
                        hoverCmp = detectHoverCmp(turnPoint);

                    if (hoverCmp) {
                        if (isCmpLineAddAble(hoverCmp, false)) {
                            dragCmp.from = hoverCmp;
                            dragCmp.locate();
                        } else {
                            alert('该节点无法添加新的出线');
                            turnPoint.x += startX - dragX;
                            turnPoint.y += startY - dragY;
                            dragCmp.locate();
                        }
                    }
                } else if (SvgPanel.focusLinePoint === lastIndex && !(dragCmp.to instanceof BlockComponent)) {
                    //拖拽最后一个

                    var turnPoint = dragCmp.points[lastIndex],
                        hoverCmp = detectHoverCmp(turnPoint);

                    if (hoverCmp) {
                        if (isCmpLineAddAble(hoverCmp, true)) {
                            dragCmp.to = hoverCmp;
                            dragCmp.locate();
                        } else {
                            alert('该节点无法添加新的入线');
                            turnPoint.x += startX - dragX;
                            turnPoint.y += startY - dragY;
                            dragCmp.locate();
                        }
                    }
                }
            }

            dragCmp = null;
        }
    }

    function svgRightMouseUp(e) {
        if (dragCmp) {
            var $items = $cmpContextMenu.children();

            $cmpContextMenu.show();
            isCmpContextMenuOpened = true;
            $items.hide();

            if (dragCmp instanceof LineComponent && SvgPanel.focusLinePoint !== null) {
                $items.filter('[data-method="nodeDelete"],[data-method="pointDelete"]').show();
            } else {
                $items.filter('[data-method="nodeDelete"]').show();
            }

            dragCmp = null;
        }

        placeCmpContextMenu(e.pageX, e.pageY);
    }

    function placeCmpContextMenu(x, y) {
        var toBottom = window.innerHeight - y,
            toRight = window.innerWidth - x;

        if (toBottom <= parseInt($cmpContextMenu.css('height'))) {
            $cmpContextMenu.css({bottom: 0, top: ''});
        } else {
            $cmpContextMenu.css({top: y, bottom: ''});
        }

        if (toRight <= parseInt($cmpContextMenu.css('width'))) {
            $cmpContextMenu.css({right: toRight, left: ''});
        } else {
            $cmpContextMenu.css({left: x, right: ''});
        }
    }

    function detectHoverCmp(point) {
        var hover = null,
            TypeEnum = SvgPanel.TypeEnum;

        $.each(SvgPanel.svgCmp.componentStore, function (id, cmp) {
            if (cmp.type !== TypeEnum.LINE) {
                var maxX = cmp.x + cmp.outterWidth / 2,
                    minX = cmp.x - cmp.outterWidth / 2,
                    maxY = cmp.y + cmp.outterHeight / 2,
                    minY = cmp.y - cmp.outterHeight / 2;

                if (point.x < maxX && point.x > minX && point.y < maxY && point.y > minY) {
                    hover = cmp;
                    return false;
                }
            }
        });
        return hover;
    }

    /**
     * @param cmp
     * @param srcOrDest src:true dest:false
     */
    function isCmpLineAddAble(cmp, srcOrDest) {
        switch (srcOrDest ? cmp.srcLineAddType : cmp.destLineAddType) {
            case SvgPanel.LineAddEnum.NONE:
                return false;
            case SvgPanel.LineAddEnum.SINGLE:
                var lines = srcOrDest ? cmp.srcLines : cmp.destLines;
                return lines.length === 0;
            case SvgPanel.LineAddEnum.MULTIPLE:
                return true;
        }
    }

    var ToolMouseUpHandler = {
        LINE: function (e) {
            var from = {x: e.svgX - 10, y: e.svgY - 10},
                to = {x: e.svgX + 10, y: e.svgY + 10};
            return SvgPanel.DataToCmp[SvgPanel.TypeEnum.LINE]({
                from: from,
                to: to,
                points: [from, to]
            });
        },
        SERVICE: function (e) {
            return SvgPanel.DataToCmp[SvgPanel.TypeEnum.SERVICE]({
                place: {x: e.svgX, y: e.svgY},
                name: '服务节点'
            });
        },
        FLOW: function (e) {
            return SvgPanel.DataToCmp[SvgPanel.TypeEnum.FLOW]({
                place: {x: e.svgX, y: e.svgY},
                name: '流程节点'
            });
        },
        TRANSACTION_BEGIN: function (e) {
            return SvgPanel.DataToCmp[SvgPanel.TypeEnum.TRANSACTION_BEGIN]({
                place: {x: e.svgX, y: e.svgY},
                name: '开始事务'
            });
        },
        TRANSACTION_COMMIT: function (e) {
            return SvgPanel.DataToCmp[SvgPanel.TypeEnum.TRANSACTION_COMMIT]({
                place: {x: e.svgX, y: e.svgY},
                name: '提交事务'
            });
        },
        DECISION: function (e) {
            return SvgPanel.DataToCmp[SvgPanel.TypeEnum.DECISION]({
                place: {x: e.svgX, y: e.svgY},
                name: '判断'
            });
        }
    };


    SvgPanel.onDestroy = function (e) {
        SvgPanel.activeFormTempData = null;

        $editedForm = $('#flowForm').removeClass('hidden');
    };

    SvgPanel.onFocus = function (e) {
        var cmp = e.target,
            type = cmp.type;

        if ($editedForm) {
            $editedForm.addClass('hidden');
        } else {
            $('#flowForm').addClass('hidden');
        }


        $editedForm = $('form[data-type="' + type + '"]').removeClass('hidden');

        $editedForm[0].reset();

        SvgPanel.activeFormTempData = null;

        SvgPanel.cmpToFormHandler[type](cmp, $editedForm);
    };


    SvgPanel.onBlur = function (e) {
        var cmp = e.target,
            type = cmp.type;

        if ($editedForm) {
            $editedForm.addClass('hidden');
        }

        SvgPanel.formToCmpHandler[type]($editedForm, cmp);

        SvgPanel.activeFormTempData = null;

        $editedForm = $('#flowForm').removeClass('hidden');
    };

    var cmpContextMenuMethods = {
        nodeDelete: function () {
            var cmp = SvgPanel.focusCmp,
                type = cmp.type;

            if (type === 'LINE') {
                if (cmp.from.type === 'FLOW') {
                    alert('流程节点的出线无法删除');
                    return;
                }
            }else if(type==='FLOW'){
                var lines = cmp.destLines;

                for (var i = lines.length - 1; i >= 0; i--) {
                    lines[i].destroy();
                }
            }

            SvgPanel.destroy(cmp)
        },
        pointDelete: function (e) {
            SvgPanel.focusCmp.removeTurnPointAt(SvgPanel.focusLinePoint);
        }
    };


    /******************************************************************************************
     ******************************************************************************************
     * 初始化
     */
    $cmpContextMenu = $('#cmpContextMenu');

    $cmpContextMenu.on('mousedown', 'a', function () {
        var method = $(this).attr('data-method');

        cmpContextMenuMethods[method]();
    });

    document.getElementById('svgContainer').addEventListener('mousedown', svgMouseDown, false);
    document.getElementById('leftContainer').addEventListener('mousedown', toolMouseDown, false);
    document.getElementById('infoResizer').addEventListener('mousedown', infoResizerMouseDown, false);
    document.addEventListener('mousedown', docMouseDown, false);
    document.addEventListener('mousemove', docMouseMove, false);
    document.addEventListener('mouseup', docMouseUp, false);
})();
/*
 var target = e.target,
 startCmp = lineStartCmp;

 dashline.hide();
 lineStartCmp = null;

 if ('cpId' in target) {
 var endCmp = SvgPanel.getCmp(target.cpId);
 if (endCmp instanceof BlockComponent) {
 if (endCmp === startCmp) {
 return;
 }

 if (startCmp.srcBlocks.indexOf(endCmp) !== -1) {
 return;
 }

 if (startCmp.destBlocks.indexOf(endCmp) !== -1) {
 return;
 }

 if (startCmp.destBlocks.length > 0 && startCmp.type !== SvgPanel.TypeEnum.DECISION) {
 return;
 }

 if (endCmp.srcBlocks.length > 0 && endCmp.type !== SvgPanel.TypeEnum.END) {
 return;
 }

 if (startCmp.type === SvgPanel.TypeEnum.END) {
 return;
 }

 if (endCmp.type === SvgPanel.TypeEnum.START) {
 return;
 }

 */