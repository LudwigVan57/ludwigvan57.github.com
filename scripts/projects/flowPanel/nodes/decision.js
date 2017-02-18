(function () {
    SvgPanel.DataToCmp.DECISION = function (data) {
        var cmp = new BlockComponent(SvgPanel.svgCmp, '../images/projects/decision.png', data.id);

        cmp.attr({x: data.place.x, y: data.place.y, width: 60, height: 60, text: data.name});

        cmp.type = SvgPanel.TypeEnum.DECISION;

        cmp.srcLineAddType = SvgPanel.LineAddEnum.SINGLE;
        cmp.destLineAddType = SvgPanel.LineAddEnum.MULTIPLE;

        cmp.data = {
            name: data.name
        };

        if (data.conditions) {
            SvgPanel.dataToCmpDtd.done(function () {
                $.each(data.conditions, function (i, condition) {
                    var lineCmp = SvgPanel.getCmp(condition.lineId),
                        lineCmpData = lineCmp.data;

                    lineCmpData.fromDecision = condition.expression;
                });
            });
        }

        return cmp;
    };

    SvgPanel.CmpToData.DECISION = function (cmp) {
        var cmpData = cmp.data;
        return {
            "id": cmp.cpId,
            "name": cmpData.name,
            "type": cmp.type,
            "place": {"x": cmp.x, "y": cmp.y},
            "conditions": []
        };
    };

    SvgPanel.cmpToFormHandler.DECISION = function (cmp, form) {
        var data = cmp.data;

        var $name = form.find('input[name="name"]');
        $name.val(data.name);
    };

    SvgPanel.formToCmpHandler.DECISION = function (form, cmp) {
        var data = cmp.data;
        var name = form.find('input[name="name"]').val();

        cmp.text = data.name = name;
    };


    /******************************************************************************************
     ******************************************************************************************
     * variables
     */

    /******************************************************************************************
     ******************************************************************************************
     * functions
     */

    /******************************************************************************************
     ******************************************************************************************
     * initialize
     */
})();