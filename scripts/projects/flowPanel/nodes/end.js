(function () {
    SvgPanel.DataToCmp.END = function (data) {
        var cmp = new BlockComponent(SvgPanel.svgCmp, '../images/projects/end.png', data.id);

        cmp.attr({x: data.place.x, y: data.place.y, width: 50, height: 50});

        cmp.type = SvgPanel.TypeEnum.END;

        cmp.srcLineAddType = SvgPanel.LineAddEnum.MULTIPLE;
        cmp.destLineAddType = SvgPanel.LineAddEnum.NONE;

        cmp.data = {
            name: data.name
        };

        if (data.results) {
            SvgPanel.dataToCmpDtd.done(function () {
                $.each(data.results, function (i, result) {
                    var lineCmp = SvgPanel.getCmp(result.lineId);

                    if (lineCmp) {
                        var lineCmpData = lineCmp.data;

                        lineCmpData.toEnd = {
                            code:result.code,
                            msg:result.msg,
                            resultList:result.resultList
                        };
                    }
                });
            });
        }

        return cmp;
    };

    SvgPanel.CmpToData.END = function (cmp) {
        var cmpData = cmp.data;
        return {
            "id": cmp.cpId,
            "name": cmpData.name,
            "results": [],
            "type": cmp.type,
            "place": {"x": cmp.x, "y": cmp.y}
        };
    };

    SvgPanel.cmpToFormHandler.END = function (cmp, form) {
        var data = cmp.data;

        var $name = form.find('input[name="name"]');
        $name.val(data.name);
    };

    SvgPanel.formToCmpHandler.END = function (form, cmp) {

    };
})();