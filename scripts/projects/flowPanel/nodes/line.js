(function () {
    SvgPanel.DataToCmp.LINE = function (data) {
        var from = data.from,
            to = data.to;

        if (typeof from === 'number') {
            from = SvgPanel.getCmp(from);
        }

        if (typeof to === 'number') {
            to = SvgPanel.getCmp(to);
        }

        var lineCmp = new LineComponent(SvgPanel.svgCmp, from, to, data.points, data.id);

        lineCmp.text = data.name;
        lineCmp.type = SvgPanel.TypeEnum.LINE;

        lineCmp.data = {
            name: data.name
        };

        if (to.type === SvgPanel.TypeEnum.SERVICE || to.type === SvgPanel.TypeEnum.FLOW) {
            data.transferRulesList && (lineCmp.data.toBox = data.transferRulesList);
        }

        return lineCmp;
    };

    SvgPanel.CmpToData.LINE = function (cmp) {
        var cmpData = cmp.data,
            from = cmp.from,
            to = cmp.to;

        var result = {
            "id": cmp.cpId,
            "name": cmpData.name,
            "points": cmp.points
        };

        result.from = (from instanceof BlockComponent) ? from.cpId : from;

        result.to = (to instanceof BlockComponent) ? to.cpId : to;

        if (from.type === SvgPanel.TypeEnum.DECISION) {
            SvgPanel.cmpToDataDtd.done(function () {
                if (cmpData.fromDecision) {
                    from.submitData.conditions.push({
                        lineId: cmp.cpId,
                        expression: cmpData.fromDecision
                    });
                }
            });
        } else if (from.type === SvgPanel.TypeEnum.FLOW) {
            SvgPanel.cmpToDataDtd.done(function () {
                if (cmpData.fromFlow) {
                    from.submitData.conditions.push(cmpData.fromFlow);
                }
            });
        }

        if (to.type === SvgPanel.TypeEnum.END) {
            SvgPanel.cmpToDataDtd.done(function () {
                var reg = /[^.]+$/;

                $.each(cmpData.toEnd.resultList,function(i,result){
                    var includes = [];

                    if(result.includesDetail){
                        $.each(result.includesDetail.split(','),function(i,name){
                            includes.push(name.match(reg).toString());
                        })
                    }

                    result.includes = getIncludesFromDetail(result.includesDetail);
                });

                to.submitData.results.push({
                    lineId: cmp.cpId,
                    code: cmpData.toEnd.code || '0',
                    msg: cmpData.toEnd.msg,
                    resultList: cmpData.toEnd.resultList
                });
            });
        } else if (to.type === SvgPanel.TypeEnum.SERVICE || to.type === SvgPanel.TypeEnum.FLOW) {
            cmpData.toBox && (result.transferRulesList = cmpData.toBox);
        }
        return result;
    };

    SvgPanel.cmpToFormHandler.LINE = function (lineCmp, form) {
        var data = lineCmp.data;

        var $name = form.find('input[name="name"]');
        $name.val(data.name);
    };

    /**
     * lineCmp.data:  {fromDecision:***,toService:***,toEnd:***,fromFlow:***}
     */
    SvgPanel.formToCmpHandler.LINE = function (form, cmp) {
        //data:{expression:*,transferRulesList:*,code:*,msg:*,resultList:*}
        var data = cmp.data,
            toCmp = cmp.to,
            fromCmp = cmp.from,
            name = form.find('input[name="name"]').val();

        cmp.text = data.name = name;

        delete data.fromDecision;
        delete data.toBox;
        delete data.toEnd;

        if (fromCmp.type === SvgPanel.TypeEnum.DECISION) {
            var exp = getExpression();

            if (exp) {
                data.fromDecision = exp;
            }
        }

        if (toCmp.type === SvgPanel.TypeEnum.SERVICE || toCmp.type === SvgPanel.TypeEnum.FLOW) {
            data.toBox = [];

            form.find('.toBoxCase li').each(function () {
                var rules = [];

                $(this).find('.content>.row').each(function () {
                    var $this = $(this),
                        $rule = $this.find('.rule-select'),
                        $defaultValue = $this.find('input[name=defaultValue]'),
                        rule = $rule.data('rule'),
                        defaultValue = $defaultValue.val();

                    if (!defaultValue && !rule) {
                        return;
                    }

                    var ruleObj = {left: $this.attr('data-left')};

                    if (rule) {
                        ruleObj.nodeId = rule.nodeId;
                        ruleObj.right = rule.right;
                        ruleObj.dynamic = true;
                    } else {
                        ruleObj.dynamic = false;
                    }

                    if (defaultValue) {
                        ruleObj.defaultValue = defaultValue;
                    }

                    rules.push(ruleObj);
                });

                data.toBox.push(rules);
            });
        } else if (toCmp.type === SvgPanel.TypeEnum.END) {
            var toEnd = data.toEnd = {resultList: []},
                $toEndInfo = form.find('.toEndCase'),
                code = $toEndInfo.find('input[name="code"]').val(),
                msg = $toEndInfo.find('input[name="msg"]').val();

            if (code) {
                toEnd.code = code;
            }

            if (msg) {
                toEnd.msg = msg;
            }

            $toEndInfo.find('tr').each(function () {
                var $this = $(this),
                    name = $this.find('input[name=name]').val(),
                    includesDetail = $this.find('input[name=includes]').val(),
                    rule = $this.find('.rule-select').data('rule');

                if (name && rule) {
                    var expression = stringifyExpression(rule);

                    toEnd.resultList.push({
                        "resultName": name, "expression": expression, "includesDetail": includesDetail
                    });
                }
            });
        }
    };

    /******************************************************************************************
     ******************************************************************************************
     * variables
     */
    var nodeReg = /^node/;

    var TRANSFER_RULES_CONTENT_TEMPLATE = '{@if children && opened}' +
        '{@each children as left}' +
        '<div class="row" data-left="${left}">' +
        '<div class="col-xs-3 control-normal">' +
        '${left}' +
        '</div>' +
        '<div class="col-xs-6">' +
        '<a class="rule-select" data-rule-select="${id}">请选择</a>' +
        '</div>' +
        '<div class="col-xs-3">' +
        '<input type="text" placeholder="请输入" name="defaultValue">' +
        '</div>' +
        '</div>' +
        '{@/each}' +
        '{@else}' +
        '<div class="row" data-left>' +
        '<div class="col-xs-3 control-normal">' +
        '<span class="glyphicon glyphicon-tower"></span>' +
        '</div>' +
        '<div class="col-xs-6">' +
        '<a class="rule-select" data-rule-select="${id}">请选择</a>' +
        '</div>' +
        '<div class="col-xs-3">' +
        '{@if !children}<input type="text" placeholder="请输入" name="defaultValue">{@/if}' +
        '</div>' +
        '</div>' +
        '{@/if}';

    var TRANSFER_RULES_TEMPLATE = '<li>' +
        '<div class="row top">' +
        '<div class="col-xs-9">${name}</div>' +
        '<div class="col-xs-3">' +
        '{@if children}<a class="glyphicon glyphicon-retweet toggle-entity"></a>{@/if}' +
        '</div>' +
        '</div>' +
        '<div class="content">' + TRANSFER_RULES_CONTENT_TEMPLATE + '</div></li>';

    var END_PARAMS_TEMPLATE = '<tr>' +
        '<td><input type="text" name="name" placeholder="请输入" class="blank"></td>' +
        '<td><a class="rule-select" >请选择</a></td>' +
        '<td><input type="text" class="form-control property-select" name="includes" readonly></td>' +
        '<td><a class="glyphicon glyphicon-minus-sign removeObject" ></a></td>' +
        '</tr>';

    var PROPERTY_SELECT_LIST = '{@each _ as value}<li class="checkbox">' +
        '{@if value.hasChildren}<a class="parent unloaded" data-class="${value.className}" data-fullname="${value.fullname}" >' +
        '<span class="glyphicon"></span>${value.name}(${value.className})' +
        '</a>' +
        '{@else}' +
        '<label><input type="checkbox" name="returnClassProperty" value="${value.fullname}" {@if value.checked}checked{@/if}>${value.name}(${value.className})</label>' +
        '{@/if}</li>{@/each}';

    /******************************************************************************************
     ******************************************************************************************
     * functions
     */
    function getExpression() {
        var $el = $('#nodeExpression');

        $el.find('a').each(function () {
            var $this = $(this);
            $this.html($this.attr('data-exp'));
        });
        return $el.text();
    }

    function setExpression(exp) {
        var $el = $('#nodeExpression');

        if (exp) {
            /*    node3=false  node1.email=1*/
            var html = exp.replace(/node\d+(\.[a-zA-Z0-9_]+)?/g, function (exp) {
                var obj = parseExpression(exp),
                    easyExp = Tool.getEasyExpression(obj);

                return '<a data-exp="' + exp + '">' + easyExp + '</a>';
            });

            $el.html(html);
        } else {
            $el.empty();
        }
    }


    function parseExpression(exp) {
        if (nodeReg.test(exp)) {
            var split = exp.split('.'),
                nodeId = split[0].substr(4),
                right = split.length > 1 ? split[1] : '';

            return {
                nodeId: nodeId,
                right: right
            };
        } else {
            return null;
        }
    }

    function stringifyExpression(rule) {
        if (rule) {
            return 'node' + rule.nodeId + (rule.right ? ('.' + rule.right) : '');
        } else {
            return '';
        }
    }

    /**
     * 添加转换规则的表单元素
     * @param $paramList
     * @param id
     * @param params
     * @param transferRulesList
     */
    function addTransferRules($paramList, params, transferRulesList) {
        $paramList.empty();

        if (!params || params.length === 0) {
            return;
        }

        var tpl = juicer(TRANSFER_RULES_TEMPLATE);


        $.each(params, function (i, param) {
            var rules = transferRulesList && transferRulesList[i];

            var $li = $(tpl.render(param));

            $li.data('transferRules', param);

            if (rules) {
                var $content = $li.children('.content');

                $.each(rules, function (i, rule) {
                    var $row = $content.children('[data-left="' + rule.left + '"]'),
                        $rule = $row.find('.rule-select'),
                        $defaultValue = $row.find('input[name=defaultValue]');

                    if (rule.nodeId) {
                        Tool.setRuleSelect($rule, {
                            nodeId: rule.nodeId,
                            right: rule.right
                        });
                    }

                    $defaultValue.val(rule.defaultValue);
                });
            }

            $paramList.append($li);
        });
    }

    function getEndResultEl(lineId, result) {
        var $el = $(END_PARAMS_TEMPLATE),
            $select = $el.find('.rule-select');

        $select.attr('data-rule-select', lineId);

        if (result) {
            $el.find('input[name=name]').val(result.resultName);
            $el.find('input[name=includes]').val(result.includesDetail);

            var expObj = parseExpression(result.expression);
            if (expObj) {
                Tool.setRuleSelect($select, expObj);
            }
        }

        return $el;
    }

    function getLeftToRightList(name) {
        var entityStore = SvgPanel.entityStore;
        if (name in entityStore) {
            var cls = entityStore[name];

            var array = [];
            $.each(cls.fields, function (i, field) {
                array.push(field.name);
            });
            return array;
        }
    }

    function getReturnClassProperties(rule, value) {
        if (!rule) {
            return null;
        }

        var cmp = SvgPanel.getCmp(rule.nodeId), fieldList = null;

        checkedMap = {};

        if(value){
            $.each(value.split(','), function (i, property) {
                checkedMap[property] = true;
            });
        }

        if (cmp.type === SvgPanel.TypeEnum.SERVICE) {
            var serviceInfo = cmp.data.serviceInfo;

            if (!serviceInfo) {
                return fieldList;
            }

            var returnClass = Tool.resolveClass(serviceInfo.returnClass);
            if (rule.right === '') {
                fieldList = getFieldListFromClass(returnClass, "");
            } else {
                var entityStore = SvgPanel.entityStore;

                if (returnClass.cls in entityStore) {
                    var returnObj = entityStore[returnClass.cls],
                        rightClass;


                    $.each(returnObj.fields, function (i, field) {
                        if (field.name === rule.right) {
                            rightClass = Tool.resolveClass(field.typeClass);
                            return false;
                        }
                    });

                    if (rightClass) {
                        fieldList = getFieldListFromClass(rightClass, "");
                    }
                }
            }
        }

        return fieldList;
    }

    /**
     * 从一个类中获取类的所有属性,包括泛形
     * 如 IFPage<EntityA>: 返回IFPage和EntityA的所有属性
     * @param {Object} returnClass
     * @param {string} parent
     * @param {Object} checkedMap
     * @returns {Object} {a:true,b:true,c:true}
     */
    function getFieldListFromClass(returnClass, parent) {
        var list = [];

        var entityStore = SvgPanel.entityStore;

        if (returnClass.cls in entityStore) {
            var clsObj = entityStore[returnClass.cls];

            $.each(clsObj.fields, addField);
        }

        if (returnClass.generic in entityStore) {
            var genericObj = entityStore[returnClass.generic];

            $.each(genericObj.fields, addField);
        }

        function addField(i, field) {
            var obj = {
                name: field.name,
                fullname: parent?(parent+'.'+field.name):field.name,
                className: field.typeClass//A<B>
            };

            var childCls = Tool.resolveClass(field.typeClass);

            obj.hasChildren = (childCls.cls in entityStore) || (childCls.generic in entityStore);

            if (!obj.hasChildren) {
                obj.checked = obj.fullname in checkedMap;
            }

            list.push(obj);
        }

        return list;
    }

    function getIncludesFromDetail(detail){
        var obj ={},result=[];

        $.each(detail.split(','),function(i,names){
            $.each(names.split('.'),function(i,name){
                obj[name]=true;
            });
        });

        $.each(obj,function(key){
           result.push(key);
        });

        return result.join(',');
    }

    /******************************************************************************************
     ******************************************************************************************
     * 初始化结束节点
     */
    var $form = $('#lineForm>.toEndCase');

    var checkedMap = null;

    /**
     * 点击includes的input,弹出modal,并将值设为该input元素
     * @type {HTMLInputElement}
     */
    var propertySelectInput = null;

    $form.find('.addObject').click(function () {
        var id = SvgPanel.focusCmp.cpId;

        $form.find('tbody').append(getEndResultEl(id));
    });

    $form.on('click', '.removeObject', function () {
        $(this).closest('tr').remove();
    });

    $('#propertySelectList').on('click', '.parent', function () {
        var $a = $(this),
            fullname = $a.attr('data-fullname'),
            cls = Tool.resolveClass($a.attr('data-class'));

        if ($a.hasClass('unloaded')) {
            $a.removeClass('unloaded').addClass('opened');

            var fieldList = getFieldListFromClass(cls, fullname);

            var resultText = juicer(PROPERTY_SELECT_LIST, fieldList);

            $a.after('<ul class="list-unstyled">' + resultText + '</ul>');
        } else {
            $a.toggleClass('opened');
        }
    }).on('change', 'input', function () {
        var $this = $(this);

        checkedMap[$this.val()] = $this.prop('checked');

    });

    $form.on('click', '.property-select', function (e) {
        $('#propertySelectModal').modal();

        propertySelectInput = e.target;

        var rule = $(propertySelectInput).closest('tr').find('.rule-select').data('rule'),
            value = propertySelectInput.value,
            properties = getReturnClassProperties(rule, value);


        var resultText = properties ? juicer(PROPERTY_SELECT_LIST, properties) : '';

        $('#propertySelectList').html(resultText);
    });

    $('#propertySelectBtn').click(function () {
        var $modal = $('#propertySelectModal');

        if (propertySelectInput) {
            var result = [];
            $.each(checkedMap, function (key, value) {
                if(value){
                    result.push(key);
                }
            });

            propertySelectInput.value = result.join(',');
            propertySelectInput = null;
        }

        $modal.modal('hide');
    });
    /******************************************************************************************
     ******************************************************************************************
     * 初始化服务节点
     */
    $('#lineForm>.toBoxCase').on('click', '.toggle-entity', function () {
        var $li = $(this).closest('li'),
            $content = $li.find('.content'),
            data = $li.data('transferRules');

        data.opened = !data.opened;

        $content.html($(juicer(TRANSFER_RULES_CONTENT_TEMPLATE, data)));
    });

    /******************************************************************************************
     ******************************************************************************************
     * 初始化判断节点
     */
    function expressionKeyDown(e) {
        if (Tool.isRuleSelectOpened) {
            e.preventDefault();
            return false;
        }

        if (e.ctrlKey) {
            var me = this;
            Tool.openRuleSelect(SvgPanel.focusCmp, $(this), function (rule) {
                if (rule) {
                    var exp = stringifyExpression(rule),
                        visibleExp = Tool.getEasyExpression(rule);

                    insertExpression(me, visibleExp, exp);
                }

            });
            return false;
        }
    }

    function insertExpression(el, visibleExp, exp) {
        var target = document.createElement("a");
        target.innerHTML = visibleExp;
        target.setAttribute('data-exp', exp);
        // target.setAttribute('contenteditable', 'false');

        var sel = window.getSelection();

        if (document.activeElement === el) {
            var range;

            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                range.insertNode(target);

                range = range.cloneRange();
                range.setStartAfter(target);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else {
            /*   var ct = el.lastChild;*/
            el.appendChild(target);

            el.focus();

            sel.selectAllChildren(el);//range 选择obj下所有子内容
            sel.collapseToEnd();//光标移至最后
        }
    }

})();