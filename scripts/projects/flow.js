(function () {
    SvgPanel.dataToCmpDtd = $.Deferred();
    SvgPanel.cmpToDataDtd = $.Deferred();

    /**
     * 初始化表单提交
     */
    var flowData = localStorage.getItem("flow");

    function initFlowAdd() {
        var containerWidth = SvgPanel.container.clientWidth * SvgPanel.aspectRatio,
            containerHeight = SvgPanel.container.clientHeight * SvgPanel.aspectRatio;

        SvgPanel.DataToCmp.START({
            place: {x: containerWidth / 2, y: 40},
            name: '开始'
        });

        SvgPanel.DataToCmp.END({
            place: {x: containerWidth / 2, y: containerHeight - 40},
            name: '结束'
        });
    }

    function initFlowEdit() {
        var definition = JSON.parse(flowData);

        $('#flowName').val(definition.name);

        $.each(definition.nodes, function (i, node) {

            if(node.type in SvgPanel.DataToCmp){
                SvgPanel.DataToCmp[node.type](node);
            }
        });

        $.each(definition.lines, function (i, line) {
            if(SvgPanel.TypeEnum.LINE in SvgPanel.DataToCmp){
                SvgPanel.DataToCmp[SvgPanel.TypeEnum.LINE](line);
            }
        });

        SvgPanel.dataToCmpDtd.resolve();
    }

    if (flowData) {
        initFlowEdit();
    } else {
        initFlowAdd();
    }

    $('#flowFormSubmit').click(function () {
        var definition = {
            name:$('#flowName').val()
        };

        var nodes = definition.nodes = [],
            lines = definition.lines = [];

        $.each(SvgPanel.svgCmp.componentStore, function (cmpId, cmp) {
            var data = SvgPanel.CmpToData[cmp.type](cmp);

            if (cmp instanceof BlockComponent) {
                nodes.push(cmp.submitData = data);
            } else if (cmp instanceof LineComponent) {
                lines.push(cmp.submitData = data);
            }
        });

        SvgPanel.cmpToDataDtd.resolve();

        localStorage.setItem('flow',JSON.stringify(definition));

        alert('保存成功！');
    });
})();