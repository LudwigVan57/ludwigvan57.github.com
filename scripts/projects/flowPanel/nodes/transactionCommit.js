(function () {
    SvgPanel.DataToCmp.TRANSACTION_COMMIT = function (data) {
        var cmp = new BlockComponent(SvgPanel.svgCmp, '../images/projects/transactionCommit.png', data.id);

        cmp.attr({x: data.place.x, y: data.place.y, width: 60, height: 60, text: data.name});

        cmp.type = SvgPanel.TypeEnum.TRANSACTION_COMMIT;

        cmp.srcLineAddType = SvgPanel.LineAddEnum.SINGLE;
        cmp.destLineAddType = SvgPanel.LineAddEnum.SINGLE;

        cmp.data = {
            name: data.name
        };

        return cmp;
    };

    SvgPanel.CmpToData.TRANSACTION_COMMIT = function (cmp) {
        var cmpData = cmp.data;
        return {
            "id": cmp.cpId,
            "name": cmpData.name,
            "type": cmp.type,
            "place": {"x": cmp.x, "y": cmp.y}
        };
    };

    SvgPanel.cmpToFormHandler.TRANSACTION_COMMIT = function (cmp, form) {
        var data = cmp.data;

        var $name = form.find('input[name="name"]');
        $name.val(data.name);
    };

    SvgPanel.formToCmpHandler.TRANSACTION_COMMIT = function (form, cmp) {
        var data = cmp.data;
        var name = form.find('input[name="name"]').val();

        cmp.text = data.name = name;
    };
})();