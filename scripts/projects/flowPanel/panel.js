(function () {
    var SVG_VIEW_WIDTH = 1400;

    window.SvgPanel = {
        onFocus: null,
        onBlur: null,
        onDestroy: null,
        activeFormTempData: null,
        aspectRatio: null,
        viewWidth: null,
        viewHeight: null,
        init: function () {
            $.each(this.readies, function (i, fn) {
                fn();
            });
        },
        getCmp: function (cpId) {
            return this.svgCmp.componentStore[cpId];
        },
        cmpToFormHandler: {},
        formToCmpHandler: {},
        CmpToData: {},
        DataToCmp: {},
        svgCmp: null,
        focusCmp: null,
        focusLinePoint: null,
        container: null,
        entityStore: null,
        TypeEnum: {
            START: 'START',
            END: 'END',
            SERVICE: 'SERVICE',
            FLOW: 'FLOW',
            DECISION: 'DECISION',
            LINE: 'LINE',
            TRANSACTION_BEGIN: 'TRANSACTION_BEGIN',
            TRANSACTION_COMMIT: 'TRANSACTION_COMMIT'
        },
        EventStateEnum: {
            NORMAL: 1,
            SVG_DRAG: 2,
            TOOL_DRAG: 3,
            INFO_RESIZE_DRAG: 4
        },
        LineAddEnum: {
            NONE: 0,
            SINGLE: 1,
            MULTIPLE: 2
        },
        eventState: 1,
        /**
         * 获得焦点方法,将触发component的获得焦点
         * @param cmp
         */
        focus: function (cmp) {
            if (cmp === SvgPanel.focusCmp) {
                return;
            }

            this.blur();

            cmp.focus();

            SvgPanel.focusCmp = cmp;

            if (this.onFocus) {
                this.onFocus({target: cmp});
            }
        },
        /**
         * 失去焦点方法,将触发component的失去焦点
         */
        blur: function () {
            var cmp = SvgPanel.focusCmp;

            if (!cmp) {
                return;
            }

            cmp.blur();

            SvgPanel.focusCmp = null;

            if (this.onBlur) {
                this.onBlur({target: cmp});
            }
        },
        /**
         * 删除组件,将触发component的删除
         * @param cmp
         */
        destroy: function (cmp) {
            if (cmp === SvgPanel.focusCmp) {
                this.blur();
            }

            cmp.destroy();

            if (this.onDestroy) {
                this.onDestroy({target: cmp});
            }
        },
        resizeSvg: function () {
            var container = SvgPanel.container, doChange = false;


            if ((container.scrollTop + container.clientHeight) >= (container.scrollHeight - 5)) {
                var height = Math.max(SvgPanel.svgCmp.attr('height'), container.clientHeight) * 1.2;

                SvgPanel.viewHeight = height * SvgPanel.aspectRatio;

                SvgPanel.svgCmp.attr('height', height);

                doChange = true;
            }

            if ((container.scrollLeft + container.clientWidth) >= (container.scrollWidth - 5)) {
                var width = Math.max(SvgPanel.svgCmp.attr('width'), container.clientWidth) * 1.2;

                SvgPanel.viewWidth = width * SvgPanel.aspectRatio;

                SvgPanel.svgCmp.attr('width', width);

                doChange = true;
            }

            if (doChange) {
                SvgPanel.svgCmp.attr('viewBox', "0 0 " + SvgPanel.viewWidth + ' ' + SvgPanel.viewHeight);
            }
        }
    };

    /******************************************************************************************
     ******************************************************************************************
     * Tool对象 用来存放一些辅助方法
     */
    window.Tool = {
        getPageDataFromArray: function (array, currentPage, pageSize) {
            var length = array.length,
                start = (currentPage - 1) * pageSize,
                end = Math.min(start + pageSize, length);

            return [array.slice(start, end), Math.ceil(length / pageSize)];
        }
    };

    /******************************************************************************************
     ******************************************************************************************
     * initialize
     */
    var svgEl = document.getElementById('flowSvg');
    SvgPanel.svgCmp = new ContainerComponent(svgEl);

    var $container = $('#svgContainer');

    SvgPanel.container = $container[0];
    SvgPanel.info = document.getElementById('info');

    var height = parseInt(SvgPanel.container.clientHeight * 1.2),
        width = parseInt(SvgPanel.container.clientWidth * 1.2);

    SvgPanel.aspectRatio = SVG_VIEW_WIDTH / width;
    SvgPanel.viewWidth = SVG_VIEW_WIDTH;
    SvgPanel.viewHeight = height * SvgPanel.aspectRatio;

    SvgPanel.svgCmp.attr({
        'viewBox': "0 0 " + SvgPanel.viewWidth + ' ' + SvgPanel.viewHeight,
        'height': height,
        'width': width
    });

    $container.on('scroll', SvgPanel.resizeSvg);
    $(window).on('resize', SvgPanel.resizeSvg)
})();