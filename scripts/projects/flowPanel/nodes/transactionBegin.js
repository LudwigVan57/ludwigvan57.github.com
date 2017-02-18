(function () {
    SvgPanel.DataToCmp.TRANSACTION_BEGIN = function (data) {
        var cmp = new BlockComponent(SvgPanel.svgCmp, '../images/projects/transactionBegin.png', data.id);

        cmp.attr({x: data.place.x, y: data.place.y, width: 60, height: 60, text: data.name});

        cmp.type = SvgPanel.TypeEnum.TRANSACTION_BEGIN;

        cmp.srcLineAddType = SvgPanel.LineAddEnum.SINGLE;
        cmp.destLineAddType = SvgPanel.LineAddEnum.SINGLE;

        cmp.data = {
            name: data.name
        };

        return cmp;
    };

    SvgPanel.CmpToData.TRANSACTION_BEGIN = function (cmp) {
        var cmpData = cmp.data;
        return {
            "id": cmp.cpId,
            "name": cmpData.name,
            "type": cmp.type,
            "place": {"x": cmp.x, "y": cmp.y}
        };
    };

    SvgPanel.cmpToFormHandler.TRANSACTION_BEGIN = function (cmp, form) {
        var data = cmp.data;

        var $name = form.find('input[name="name"]');
        $name.val(data.name);
    };

    SvgPanel.formToCmpHandler.TRANSACTION_BEGIN = function (form, cmp) {
        var data = cmp.data;
        var name = form.find('input[name="name"]').val();

        cmp.text = data.name = name;
    };
})();