(function () {
    SvgPanel.DataToCmp.FLOW = function (data) {
        var cmp = new BlockComponent(SvgPanel.svgCmp, '../images/projects/flow.png', data.id);

        cmp.attr({x: data.place.x, y: data.place.y, width: 60, height: 60, text: data.name});

        cmp.type = SvgPanel.TypeEnum.FLOW;

        cmp.srcLineAddType = SvgPanel.LineAddEnum.SINGLE;
        cmp.destLineAddType = SvgPanel.LineAddEnum.NONE;

        cmp.data = {
            name: data.name,
            flowId: data.flowId,
            flowName: data.flowName,
            input: data.input
        };

        if (data.conditions) {
            SvgPanel.dataToCmpDtd.done(function () {
                $.each(data.conditions, function (i, condition) {
                    var lineCmp = SvgPanel.getCmp(condition.lineId);

                    lineCmp.data.fromFlow = condition;
                });
            });
        }

        return cmp;
    };

    SvgPanel.CmpToData.FLOW = function (cmp) {
        var cmpData = cmp.data;

        var result = {
            "id": cmp.cpId,
            "name": cmpData.name,
            "type": cmp.type,
            "place": {"x": cmp.x, "y": cmp.y},
            "conditions": []
        };

        cmpData.flowId && (result.flowId = cmpData.flowId );
        cmpData.flowName && (result.flowName = cmpData.flowName );
        cmpData.input && (result.input = cmpData.input );

        return result;
    };

    SvgPanel.cmpToFormHandler.FLOW = function (cmp, form) {
        var data = cmp.data;

        var $name = form.find('input[name="name"]');

        $name.val(data.name);

        $('#selectedFlowName').html(data.flowName || '');
        $('#selectedFlowId').html(data.flowId || '');
    };

    SvgPanel.formToCmpHandler.FLOW = function (form, cmp) {
        var data = cmp.data;
        var name = form.find('input[name="name"]').val();


        cmp.text = data.name = name;

        var tempData = SvgPanel.activeFormTempData;

        if (tempData) {
            data.flowId = tempData.flowId;
            data.flowName = tempData.flowName;
            data.input = tempData.input;
        }
    };

    /******************************************************************************************
     ******************************************************************************************
     * variables
     */
    var flowPaging;

    var FLOW_LIST_TEMPLATE = '<tr data-id="${_r.flowId}"><td>${_r.flowId}</td><td>${_r.flowName}</td></tr>';

    /******************************************************************************************
     ******************************************************************************************
     * functions
     */
    function flowModalShow() {
        if (!flowPaging) {
            flowPaging = $('#flowList').paging({
                pageSize: 10,
                updateSearch: false,
                pagination: "#flowPagination",
                template: FLOW_LIST_TEMPLATE,
                request: requestFlowList
            });
        } else {
            flowPaging.reload();
        }
    }

    function requestFlowList(currentPage, pageSize, deferred) {
        $.get('__000000', {pageNum: currentPage, pageSize: pageSize}, function (data) {
            if (data.code === 0) {
                var result = data.result;
                deferred.resolve(result.flows, Math.ceil(result.page.total / pageSize));
            } else {
                deferred.reject();
            }
        });
    }

    function removeOutLines(cmp) {
        var lines = cmp.destLines;

        for (var i = lines.length - 1; i >= 0; i--) {
            lines[i].destroy();
        }
    }

    function addLineForFlowNode(output) {
        var cmp = SvgPanel.focusCmp,
            yShift = 100,
            angle = Math.PI / (output.length + 1);

        removeOutLines(cmp);

        $.each(output, function (i, data) {
            var xShift = Number((yShift / Math.tan(angle * (i + 1))).toFixed(0));

            var point = {x: cmp.x + xShift, y: cmp.y + yShift};

            var lineCmp = SvgPanel.DataToCmp[SvgPanel.TypeEnum.LINE]({
                from: cmp,
                to: point
            });

            var flowData = lineCmp.data.fromFlow = {};

            flowData.code = data.code;
            data.msg && (flowData.msg = data.msg);
            flowData.expression = 'node' + cmp.cpId + '.code==' + data.code;
            flowData.lineId = lineCmp.cpId;
            flowData.resultList = data.resultList;

            lineCmp._points = [point, point];

            lineCmp.locate();
        });
    }

    function selectFlow() {
        var flowId = $(this).attr('data-id'),
            startNode, endNode;

        $.get('__000001', {flowId: flowId}, function (data) {
            if (data.code === 0) {
                var flow = data.result.flow,
                    definition = JSON.parse(flow.definition);

                $.each(definition.nodes, function (i, node) {
                    if (node.type === 'START') {
                        startNode = node;
                    } else if (node.type === 'END') {
                        endNode = node;
                    }
                });

                var input, output;

                if (startNode.paramsTemplate) {
                    input = JSON.parse(startNode.paramsTemplate);
                } else {
                    alert('该流程入参不合法');
                    return;
                }

                if (endNode.results && endNode.results.length > 0) {
                    output = endNode.results;
                } else {
                    alert('该流程出参不合法');
                    return;
                }

                SvgPanel.activeFormTempData = {
                    flowId: definition.flowId,
                    flowName: definition.flowName,
                    input: input
                };

                $('#selectedFlowId').html(definition.flowId);
                $('#selectedFlowName').html(definition.flowName);

                addLineForFlowNode(output);

                $('#flowModal').modal('hide');
            }
        });
    }

    /******************************************************************************************
     ******************************************************************************************
     * initialize
     */
    $('#flowModal').on('show.bs.modal', flowModalShow);

    $('#flowList').on('click', 'tr', selectFlow);
})();