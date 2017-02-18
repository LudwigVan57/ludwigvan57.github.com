(function () {
    SvgPanel.DataToCmp.START = function (data) {
        var cmp = new BlockComponent(SvgPanel.svgCmp, '../images/projects/start.png', data.id);

        cmp.attr({x: data.place.x, y: data.place.y, width: 50, height: 50});

        cmp.type = SvgPanel.TypeEnum.START;

        cmp.srcLineAddType = SvgPanel.LineAddEnum.NONE;
        cmp.destLineAddType = SvgPanel.LineAddEnum.SINGLE;

        cmp.data = {
            name: data.name,
            httpMethod: data.httpMethod,
            contentType: data.contentType,
            roleIds: data.roleIds,
            authenticateNeeded: data.authenticateNeeded
        };

        if ('paramsTemplate' in data) {
            cmp.data.paramsTemplate = JSON.parse(data.paramsTemplate);
        }

        return cmp;
    };

    SvgPanel.CmpToData.START = function (cmp) {
        var cmpData = cmp.data;
        return {
            "id": cmp.cpId,
            "name": cmpData.name,
            "type": cmp.type,
            "httpMethod": cmpData.httpMethod,
            "contentType": cmpData.contentType,
            "authenticateNeeded": cmpData.authenticateNeeded,
            "paramsTemplate": JSON.stringify(cmpData.paramsTemplate),
            "roleIds": cmpData.roleIds,
            "place": {"x": cmp.x, "y": cmp.y}
        };
    };

    SvgPanel.cmpToFormHandler.START = function (cmp, form) {
        var data = cmp.data;

        var $name = form.find('input[name="name"]');
        $name.val(data.name);


   /*     roleListDtd.done(function (roleData) {
            if (roleData.code === 0) {
                fillFormRoleData(data.roleIds, roleData.result.roles);
                fillSelectedRoles(SvgPanel.activeFormTempData);
            }
        });*/
    };

    SvgPanel.formToCmpHandler.START = function (form, cmp) {
        var data = cmp.data;

        data.httpMethod = form.find('select[name="httpMethod"]').val();
        data.contentType = form.find('select[name="contentType"]').val();
        data.authenticateNeeded = form.find('input[name="authenticateNeeded"]').prop('checked');
        data.paramsTemplate = getParamsTemplate();

        data.roleIds = [];

        if (SvgPanel.activeFormTempData) {
            $.each(SvgPanel.activeFormTempData, function (roleId) {
                data.roleIds.push(roleId);
            });
        }
    };

    /******************************************************************************************
     ******************************************************************************************
     * variables
     */
    var roleListDtd = null;

    var selectedRoles = null;

    var START_PARAMS_TEMPLATE = '<tr>' +
        '<td><input type="text" name="name" placeholder="请输入" class="blank" ></td>' +
        '<td><select name="type" class="btn btn-info btn-xs" ><option>String</option><option>Number</option><option>Boolean</option><option>Null</option></select></td>' +
        '<td><a class="glyphicon glyphicon-minus-sign removeObject" ></a></td>' +
        '</tr>';

    var ROLE_LIST_TEMPLATE = '<li class="checkbox"><label><input type="checkbox" name="role" value="${_r.roleId}">${_r.roleName}</label></li>';


    /******************************************************************************************
     ******************************************************************************************
     * functions
     */
    function fillFormRoleData(roleIds, roles) {
        if (roleIds) {
            SvgPanel.activeFormTempData = {};
            $.each(roleIds, function (i, roleId) {
                SvgPanel.activeFormTempData[roleId] = null;
            });

            $.each(roles, function (i, role) {
                var roleId = role.roleId;
                if (roleId in SvgPanel.activeFormTempData) {
                    SvgPanel.activeFormTempData[roleId] = role.roleName;
                }
            });
        }
    }

    function setParamsTemplate(paramsTemplate) {
        var $tbody = $('#objectFilter>tbody');

        $tbody.empty();

        if (paramsTemplate) {
            $.each(paramsTemplate, function (name, type) {
                var $el = $(START_PARAMS_TEMPLATE).appendTo($tbody);
                $el.find('input[name="name"]').val(name);
                $el.find('select[name="type"]').val(type);
            });
        }
    }

    function fillSelectedRoles(roles) {
        var str = [];

        if (roles) {
            $.each(roles, function (roleId, roleName) {
                str.push(roleName);
            });
        }

        $('#selectedRoles').html(str.join(','));
    }

    function initStartForm() {
        var $cmpTable = $('#objectFilter');

        $cmpTable.find('.addObject').click(function () {
            $cmpTable.children('tbody').append(START_PARAMS_TEMPLATE);
        });

        $cmpTable.on('click', '.removeObject', function () {
            $(this).closest('tr').remove();
        });

        initRoles();
    }

    function initRoles() {
        var $roleModal = $('#roleModal'), paging;

        $roleModal.on('show.bs.modal', function () {
            selectedRoles = SvgPanel.activeFormTempData || {};

            if (!paging) {
                paging = $('#roleList').paging({
                    pageSize: 10,
                    updateSearch: false,
                    pagination: "#rolePagination",
                    template: ROLE_LIST_TEMPLATE,
                    request: requestRoleList,
                    onPageChange: rolePageChange
                });
            } else {
                paging.reload();
            }
        });

        $roleModal.on('change', 'input', function () {
            var $input = $(this),
                roleId = $input.val();

            if ($input.prop('checked')) {
                selectedRoles[roleId] = $input.parent().text();
            } else {
                delete selectedRoles[roleId];
            }
        });

        $('#roleSelectBtn').click(function () {
            fillSelectedRoles(selectedRoles);
            SvgPanel.activeFormTempData = selectedRoles;
            selectedRoles = null;

            $roleModal.modal('hide');
        });
    }

    function rolePageChange() {
        $('#roleList').find('input').each(function () {
            var $input = $(this),
                roleId = $input.val();

            if (roleId in selectedRoles) {
                $input.prop('checked', true);
            }
        });
    }

    function requestRoleList(currentPage, pageSize, deferred) {
        roleListDtd.done(function (data) {
            if (data.code === 0) {
                var list = SvgPanel.getPageDataFromArray(data.result.roles, currentPage, pageSize);
                deferred.resolve.apply(window, list);
            }
        });

    }

    function getParamsTemplate() {
        var $tableRows = $('#objectFilter>tbody>tr'),
            params = {};

        $tableRows.each(function () {
            var $this = $(this),
                name = $.trim($this.find('input[name="name"]').val()),
                type = $this.find('select[name="type"]').val();

            if (name !== '') {
                params[name] = type;
            } else {
                $this.remove();
            }
        });

        return params;
    }

    initStartForm();
})();