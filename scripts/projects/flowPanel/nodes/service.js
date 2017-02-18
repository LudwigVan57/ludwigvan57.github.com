(function () {
    SvgPanel.DataToCmp.SERVICE = function (data) {
        var cmp = new BlockComponent(SvgPanel.svgCmp, '../images/projects/service.png', data.id);

        cmp.attr({x: data.place.x, y: data.place.y, width: 60, height: 60, text: data.name});

        cmp.type = SvgPanel.TypeEnum.SERVICE;

        cmp.srcLineAddType = SvgPanel.LineAddEnum.SINGLE;
        cmp.destLineAddType = SvgPanel.LineAddEnum.SINGLE;

        cmp.data = {
            name: data.name,
            serviceInfo: data.serviceInfo
        };

        return cmp;
    };

    SvgPanel.CmpToData.SERVICE = function (cmp) {
        var cmpData = cmp.data;
        return {
            "id": cmp.cpId,
            "name": cmpData.name,
            "type": cmp.type,
            "place": {"x": cmp.x, "y": cmp.y},
            'serviceInfo': cmpData.serviceInfo
        };
    };

    SvgPanel.cmpToFormHandler.SERVICE = function (cmp, form) {
        var data = cmp.data;

        var serviceInfo = data.serviceInfo;

        var $name = form.find('input[name="name"]');
        $name.val(data.name);

        if (serviceInfo) {
            form.find('.serviceClass').html(serviceInfo.serviceClass);

            form.find('.method').html(serviceInfo.method);

            form.find('.returnClass').html(convertEntityStr(serviceInfo.returnClass));

            $('#parameterClasses').html(juicer(PARAMETER_CLASS_LIST_TEMPLATE, serviceInfo));
        } else {
            form.find('.serviceClass').html('请选择');

            form.find('.method').empty();

            form.find('.returnClass').empty();

            $('#parameterClasses').empty();
        }

        SvgPanel.activeFormTempData = serviceInfo;
    };

    SvgPanel.formToCmpHandler.SERVICE = function (form, cmp) {
        var data = cmp.data;
        var name = form.find('input[name="name"]').val();

        cmp.text = data.name = name;

        /**
         * 如果服务节点的类和方法变更了
         * 清空到达该节点所有线的转换规则
         */
        if (data.serviceInfo && (data.serviceInfo.serviceClass !== SvgPanel.activeFormTempData.serviceClass ||
            data.serviceInfo.method !== SvgPanel.activeFormTempData.method)) {
            $.each(cmp.srcLines, function (i, line) {
                line.data.transferRulesList = null;
            });
        }

        data.serviceInfo = SvgPanel.activeFormTempData;
    };

    /******************************************************************************************
     ******************************************************************************************
     * variables
     */
    var servicePaging;

    var serviceModuleList;

    var openedIndexArray = [];

    var PARAMETER_CLASS_LIST_TEMPLATE = '{@each parameterClasses as name,i}<li><h4>${parameterNames[i]}</h4><p>${name}</p></li>{@/each}';

    var MODULE_LIST_TEMPLATE =
        '{@if _r.packageName}<tr class="type1 level0" data-index="${_i}" >' +
        '<td><span class="glyphicon glyphicon-folder-close"></span>${_r.packageName}</td>' +
        '<td><div class="description" title="${_r.description}">${_r.description}</div></td>' +
        '</tr>' +
        '{@else}<tr class="type2 level0" data-index="${_i}" >' +
        '<td><span class="glyphicon glyphicon-triangle-bottom"></span>${_r.className}</td>' +
        '<td><div class="description" title="${_r.description}">${_r.description}</div></td>' +
        '</tr>{@/if}';

    var MODULE_LIST_CHILD_TEMPLATE =
        '{@if packageName}{@each modules as _r,_i}' +
        '<tr class="type2 level${level}" data-index="${_i}">' +
        '<td><span class="glyphicon glyphicon-triangle-bottom"></span>${_r.className}</td>' +
        '<td><div class="description" title="${_r.description}">${_r.description}</div></td>' +
        '</tr>' +
        '{@/each}' +
        '{@else}}{@each functions as _r,_i}}' +
        '<tr class="type3 level${level}" data-index="${_i}">' +
        '<td>${_r.methodName}</td>' +
        '<td><div class="description" title="${_r.description}">${_r.description}</div></td>' +
        '</tr>' +
        '{@/each}{@/if}';

    /******************************************************************************************
     ******************************************************************************************
     * functions
     */
    function openModuleRow($tr) {
        $tr.addClass('opened');

        var className = $tr.attr('class'),
            index = $tr.attr('data-index'),
            level = Number(className.match(/level(\d)/)[1]);

        $tr.siblings('.opened.level' + level).each(function () {
            closeModuleRow($(this));
        });

        openedIndexArray[level] = index;
        var data = getModuleRowData(index, level);

        data.level = level + 1;

        $tr.after(juicer(MODULE_LIST_CHILD_TEMPLATE, data));
    }

    function closeModuleRow($tr) {
        $tr.removeClass('opened');

        var levelClass = $tr.attr('class').match(/level\d/)[0];

        var $nextChild = $tr.next();

        while (!$nextChild.hasClass(levelClass)) {
            $nextChild.remove();
            $nextChild = $tr.next();

            if ($nextChild.length == 0) {
                break;
            }
        }
    }

    function getModuleRowData(index, level) {
        //array
        var curData = servicePaging.dataList;

        for (var i = 0; i <= level; i++) {
            var target = (i == level) ? index : openedIndexArray[i];

            if (i === 0) {
                curData = curData[target];
            } else if ('packageName' in curData) {
                curData = curData.modules[target];
            } else if ('className' in curData) {
                var data = curData.functions[target];

                var parameterClasses = [],
                    parameterNames = [];

                $.each(data.params, function (i, param) {
                    parameterClasses.push(param.typeClass);
                    parameterNames.push(param.name);
                });
                return {
                    "serviceClass": curData.className,
                    "method": data.methodName,
                    "parameterClasses": parameterClasses,
                    "parameterNames": parameterNames,
                    "returnClass": data.returnClass
                };
            }
        }

        return curData;
    }

    /**
     * 带泛形字符串转换成html
     * @param str
     */
    function convertEntityStr(str) {
        return str.replace(/<(\S+)>$/, '<<a class="entity-show">$1</a>>');
    }

    /**
     *
     * @param currentPage
     * @param pageSize
     * @param deferred
     */
    function requestServiceModules(currentPage, pageSize, deferred) {
        if (serviceModuleList) {
            deferred.resolve.apply(window, Tool.getPageDataFromArray(serviceModuleList, currentPage, pageSize));
        } else {
            $.get('../flow/__000004', function (data) {
                if (data.code === 0) {
                    serviceModuleList = data.result.modules;

                    deferred.resolve.apply(window, Tool.getPageDataFromArray(serviceModuleList, currentPage, pageSize));
                }
            })
        }
    }

    function serviceModalShow() {
        if (!servicePaging) {
            servicePaging = $('#serviceList').paging({
                pageSize: 10,
                updateSearch: false,
                pagination: "#servicePagination",
                template: MODULE_LIST_TEMPLATE,
                request: requestServiceModules
            });
        } else {
            servicePaging.reload();
        }
    }

    function serviceModalListClick(e) {
        var $this = $(this),
            className = $this.attr('class'),
            typeClass = className.match(/type\d/)[0];

        if (typeClass === 'type3') {
            var level = Number(className.match(/level(\d)/)[1]);

            var index = $this.attr('data-index'),
                data = getModuleRowData(index, level);

            var activeFormTempData = SvgPanel.activeFormTempData = data;

            var $form = $('#serviceForm');

            $form.find('.serviceClass').html(activeFormTempData.serviceClass);

            $form.find('.method').html(activeFormTempData.method);

            $form.find('.returnClass').html(convertEntityStr(activeFormTempData.returnClass));

            $('#parameterClasses').html(juicer(PARAMETER_CLASS_LIST_TEMPLATE, activeFormTempData));

            $('#serviceModal').modal('hide');
        } else {
            if ($this.hasClass('opened')) {
                closeModuleRow($this);
            } else {
                openModuleRow($this);
            }
        }
    }

    /******************************************************************************************
     ******************************************************************************************
     * initialize
     */
    var $serviceModal = $('#serviceModal');

    $serviceModal.on('show.bs.modal', serviceModalShow);

    $serviceModal.on('click', 'tr', serviceModalListClick);

    $serviceModal = null;
})();