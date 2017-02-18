(function () {
    /**
     * generate unique id
     */
    var idIndex = 0;

    function genId(id) {
        if (id === undefined) {
            return ++idIndex;
        } else {
            if (id > idIndex) {
                idIndex = id;
            }
            return id;
        }
    }

    var PI = Math.PI, HPI = Math.PI / 2, HPI3 = PI + HPI, PI2 = PI * 2;

    var XMLNS = "http://www.w3.org/2000/svg";
    var XMLNS_XLINK = "http://www.w3.org/1999/xlink";

    /**
     * 基本组件
     * @constructor
     */
    window.BaseComponent = function (element) {
        if (typeof element === 'string') {
            this.element = document.createElementNS(XMLNS, element);
        } else if (typeof element === 'object') {
            this.element = element;
        }

        this.type = null;
        this.data = null;
    };

    BaseComponent.prototype = {
        show: function () {
            this.element.removeAttributeNS(null, 'display');
        },
        hide: function () {
            this.element.setAttributeNS(null, 'display', 'none');
        },
        attr: function (attrName, attrValue) {
            if (typeof attrName === 'object') {
                var el = this.element,
                    me = this;

                $.each(attrName, function (name, value) {
                    if (name in me) {
                        me[name] = value;
                    } else {
                        el.setAttributeNS(null, name, value);
                    }
                });
            } else {
                if (attrValue) {
                    if (attrName in this) {
                        this[attrName] = attrValue;
                    } else {
                        this.element.setAttributeNS(null, attrName, attrValue);
                    }
                } else {
                    if (attrName in this) {
                        return this[attrName];
                    } else {
                        return this.element.getAttributeNS(null, attrName);
                    }
                }

            }
        },
        getAttribute: function (attrName) {
            if (attrName in this) {
                return this[attrName];
            } else {
                return this.element.getAttributeNS(null, attrName);
            }
        }
    };

    /**
     * 容器组件
     * @constructor
     */
    window.ContainerComponent = function (element) {
        this.element = element;
        this.componentStore = {};


        var offset = $(element).offset();

        this.offsetLeft = offset.left;
        this.offsetTop = offset.top;
    };
    ContainerComponent.prototype = new BaseComponent();

    ContainerComponent.prototype.append = function (component) {
        this.element.appendChild(component.element);
        if (component.cpId) {
            this.componentStore[component.cpId] = component;
        }
    };

    ContainerComponent.prototype.prepend = function (component) {
        this.element.prependChild(component.element);
        if (component.cpId) {
            this.componentStore[component.cpId] = component;
        }
    };

    /**
     * 块组件
     * @constructor
     */
    var BLOCK_COLOR = 'none';
    var BLOCK_ACTIVE_COLOR = 'green';
    var BLOCK_TEXT_MIN_WIDTH = 80;
    var TEXT_SIZE = 12;
    var TEXT_LINE_HEIGHT = 20;
    var BLOCK_PADDING = 3;

    var $detect;

    window.BlockComponent = function (container, imageUrl, id) {
        this.cpId = genId(id);
        this.element = document.createElementNS(XMLNS, 'g');

        this._x = 0;
        this._y = 0;
        this._width = 0;
        this._height = 0;
        this._text = null;

        this.outterHeight = 0;
        this.outterWidth = 0;

        this.srcLines = [];
        this.destLines = [];
        this.srcBlocks = [];
        this.destBlocks = [];

        this.image = document.createElementNS(XMLNS, 'image');
        this.image.setAttributeNS(XMLNS_XLINK, 'xlink:href', imageUrl);
        this.element.appendChild(this.image);

        this.rect = document.createElementNS(XMLNS, 'rect');
        this.rect.setAttributeNS(null, 'fill', 'transparent');
        this.rect.setAttributeNS(null, 'stroke-width', '2');
        this.element.appendChild(this.rect);

        this.rect.cpId = this.cpId;

        this.container = container;
        container.append(this);
    };
    BlockComponent.prototype = new BaseComponent();

    BlockComponent.prototype.focus = function () {
        this.rect.setAttributeNS(null, 'stroke', BLOCK_ACTIVE_COLOR);
        this.isFocused = true;
    };
    BlockComponent.prototype.blur = function () {
        this.rect.setAttributeNS(null, 'stroke', BLOCK_COLOR);
        this.isFocused = false;
    };

    BlockComponent.prototype.destroy = function () {
        this.element.parentNode.removeChild(this.element);

        for (var i = this.srcLines.length - 1; i >= 0; i--) {
            var sl = this.srcLines[i];
            sl.to = sl._points[sl._points.length-1];
           // this.srcLines[i].destroy();
        }

        for (var j = this.destLines.length - 1; j >= 0; j--) {
            var dl = this.destLines[j];
            dl.from = dl._points[0];
          //  this.destLines[j].destroy();
        }

        this.srcLines = null;
        this.destLines = null;

        delete this.container.componentStore[this.cpId];
    };

    Object.defineProperties(BlockComponent.prototype, {
        'width': {
            get: function () {
                return this._width;
            },
            set: function (value) {

                this._width = value;

                var left = (-value / 2);

                this.image.setAttributeNS(null, 'width', value);
                this.image.setAttributeNS(null, 'x', left + '');
                if (this._text !== null) {
                    var textWidth = Math.max(BLOCK_TEXT_MIN_WIDTH, value);

                    this.outterWidth = textWidth + BLOCK_PADDING * 2;
                    this.textEl.setAttributeNS(null, 'x', '0');
                    this.textEl.innerHTML = clampText(this._text, textWidth);
                } else {
                    this.outterWidth = value + BLOCK_PADDING * 2;
                }

                this.rect.setAttributeNS(null, 'width', this.outterWidth);
                this.rect.setAttributeNS(null, 'x', (-this.outterWidth / 2) + '');

                if (this.outterHeight) {
                    var a = Math.atan(this.outterWidth / this.outterHeight / 2),
                        b = Math.atan(this.outterHeight / this.outterWidth / 2);
                    this.angleLimit = [a, HPI - b, HPI + b, PI - a, PI + a, HPI3 - b, HPI3 + b, PI2 - a];
                }
            }
        },
        'height': {
            get: function () {
                return this._height;
            },
            set: function (value) {
                this._height = value;

                var top = (-value / 2) + '';

                this.image.setAttributeNS(null, 'height', value);

                if (this._text !== null) {
                    this.outterHeight = value + TEXT_SIZE + BLOCK_PADDING * 2 + 1;
                    this.image.setAttributeNS(null, 'y', (-this.outterHeight / 2 + BLOCK_PADDING) + '');
                    this.textEl.setAttributeNS(null, 'y', (this.outterHeight / 2 - BLOCK_PADDING) + '');
                } else {
                    this.outterHeight = value + BLOCK_PADDING * 2;
                    this.image.setAttributeNS(null, 'y', top);
                }

                this.rect.setAttributeNS(null, 'height', this.outterHeight);
                this.rect.setAttributeNS(null, 'y', (-this.outterHeight / 2) + '');

                if (this.outterWidth) {
                    var a = Math.atan(this.outterWidth / this.outterHeight / 2),
                        b = Math.atan(this.outterHeight / this.outterWidth / 2);
                    this.angleLimit = [a, HPI - b, HPI + b, PI - a, PI + a, HPI3 - b, HPI3 + b, PI2 - a];
                }
            }
        },
        'x': {
            get: function () {
                return this._x;
            },
            set: function (value) {
                this._x = value;
                this.element.setAttributeNS(null, 'transform', 'translate(' + this._x + ',' + this._y + ')');
            }
        },
        'y': {
            get: function () {
                return this._y;
            },
            set: function (value) {
                this._y = value;
                this.element.setAttributeNS(null, 'transform', 'translate(' + this._x + ',' + this._y + ')');
            }
        },
        'text': {
            get: function () {
                return this._text;
            },
            set: function (value) {
                if (value === '') {
                    value = null;
                }

                if (value === this._text) {
                    return;
                }

                if (value === null) {
                    this.textEl.parentNode.removeChild(this.textEl);
                    this._text = null;

                    if (this._width) {
                        this.width = this.width;
                    }

                    if (this._height) {
                        this.height = this.height;
                    }
                } else {
                    if (this._text === null) {
                        this.textEl = document.createElementNS(XMLNS, 'text');
                        this.textEl.setAttributeNS(null, 'text-anchor', 'middle');
                        this.textEl.setAttributeNS(null, 'font-size', TEXT_SIZE);
                        this.textEl.setAttributeNS(null, 'color', '#000000');
                        this.element.insertBefore(this.textEl, this.rect);
                    }

                    this.textEl.innerHTML = value;
                    this._text = value;

                    if (this._width) {
                        this.width = this.width;
                    }

                    if (this._height) {
                        this.height = this.height;
                    }
                }
            }
        }
    });

    function clampText(text, width) {
        if (!$detect) {
            $detect = $('<div class="detect-div" />');

            $detect.appendTo('body');
        }

        $detect.width(width);

        var reg = /[\s\S]\.{3}$/;
        $detect.html(text);

        var height = $detect.height();

        if (height <= TEXT_LINE_HEIGHT) {
            return text;
        }

        var after = '...';

        text += after;

        while (height > TEXT_LINE_HEIGHT) {
            text = text.replace(reg, after);
            $detect.html(text);
            height = $detect.height();
        }

        return text;
    }

    /**
     * 线组件
     * @constructor
     */
    var LINE_COLOR = 'black';
    var LINE_ACTIVE_COLOR = 'green';
    var CLOCK = [{x: 0, y: -1}, {x: 1, y: -1}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}, {x: -1, y: 1}, {
        x: -1,
        y: 0
    }, {x: -1, y: -1}];
    window.LineComponent = function (container, from, to,points, id) {
        this.cpId = genId(id);

        this.element = document.createElementNS(XMLNS, 'g');

        this._text = null;
        this._from = null;
        this._to = null;

        this.polyline = document.createElementNS(XMLNS, 'polyline');
        this.polyline.setAttributeNS(null, 'stroke', LINE_COLOR);
        this.polyline.setAttributeNS(null, 'stroke-width', '2');
        this.polyline.setAttributeNS(null, 'fill', 'none');
        this.polyline.setAttributeNS(null, 'marker-end', "url(#arrow)");
        this.element.appendChild(this.polyline);

        this.scopeline = document.createElementNS(XMLNS, 'polyline');
        this.scopeline.setAttributeNS(null, 'stroke', 'transparent');
        this.scopeline.setAttributeNS(null, 'stroke-width', '10');
        this.scopeline.setAttributeNS(null, 'fill', 'none');
        this.element.appendChild(this.scopeline);

        this._points = null;

        // 第一个为startEl,如果from为BlockComponent或null,startEl为null;
        // 最后一个为endEl,如果to为BlockComponent或null,endEl为null;
        this.turnPointElements = [];

        this.scopeline.cpId = this.cpId;

        this.container = container;
        container.append(this);

        this.from = from;
        this.to = to;
        this.points = points;
    };
    LineComponent.prototype = new BaseComponent();

    LineComponent.prototype.focus = function () {
        this.isFocused = true;
        this.polyline.setAttributeNS(null, 'stroke', LINE_ACTIVE_COLOR);
        this.polyline.setAttributeNS(null, 'marker-end', "url(#activeArrow)");

        if (this.textEl) {
            this.textEl.setAttributeNS(null, 'fill', LINE_ACTIVE_COLOR);
        }

        $.each(this.turnPointElements, function (i, el) {
            el.removeAttributeNS(null, 'display');
        });
    };

    LineComponent.prototype.blur = function () {
        this.isFocused = false;
        this.polyline.setAttributeNS(null, 'stroke', LINE_COLOR);
        this.polyline.setAttributeNS(null, 'marker-end', "url(#arrow)");

        if (this.textEl) {
            this.textEl.setAttributeNS(null, 'fill', LINE_COLOR);
        }

        $.each(this.turnPointElements, function (i, el) {
            el.setAttributeNS(null, 'display', 'none');
        });
    };

    /**
     * 重设起点,终点
     */
    LineComponent.prototype.locate = function () {
        var points = this._points,
            from = this._from,
            to = this._to,
            startPoint, endPoint;

        if (!from || !to) {
            return;
        }

        var hasTurnPoint = points && points.length>2;

        if (from instanceof BlockComponent) {
            var next = hasTurnPoint? points[1] : to;
            startPoint = getJunctionInComponent(from, next);
        } else if (typeof from === 'object') {
            startPoint = from;
        }

        if (to instanceof BlockComponent) {
            var pre = hasTurnPoint ? points[points.length - 2] : from;
            endPoint = getJunctionInComponent(to, pre);
        } else if (typeof to === 'object') {
            endPoint = to;
        }

        if (points) {
            points[0] = startPoint;
            points[points.length - 1] = endPoint;
            this.points = points;
        } else {
            this.points = [startPoint, endPoint];
        }
    };

    LineComponent.prototype.addTurnPoint = function (point) {
        var points = this._points;

        var minDistance = null, minIndex = null;

        for (var i = 0, l = points.length - 1; i < l; i++) {
            var start = points[i],
                end = points[i + 1];

            var distance = distanceFromPointToLine(point, start, end);

            if (minDistance === null || distance < minDistance) {
                minDistance = distance;
                minIndex = i;
            }
        }

        points.splice(minIndex + 1, 0, point);

        this.points = points;
    };

    LineComponent.prototype.removeTurnPointAt = function (index) {
        var points = this._points;

        if(index === 0 || index === (points.length-1)){
            return false;
        }

        points.splice(index, 1);

        this.points = points;

        return true;
    };

    LineComponent.prototype.destroy = function () {
        this.element.parentNode.removeChild(this.element);

        this.clearRelatives();

        delete this.container.componentStore[this.cpId];
    };

    /**
     *
     * @param target true为清除from,false为清除to
     */
    LineComponent.prototype.clearRelatives = function (target) {
        var from = this._from,
            isFromCmp = from instanceof BlockComponent,
            to = this._to,
            isToCmp = to instanceof BlockComponent;

        if(target === undefined){
            if (isFromCmp) {
                removeFromArray(from.destLines, this);
            }

            if (isToCmp) {
                removeFromArray(to.srcLines, this);
            }

            if (isFromCmp && isToCmp) {
                removeFromArray(from.destBlocks, to);
                removeFromArray(to.srcBlocks, from);
            }
        }else if(target){
            if (isFromCmp) {
                removeFromArray(from.destLines, this);
            }

            if (isFromCmp && isToCmp) {
                removeFromArray(from.destBlocks, to);
                removeFromArray(to.srcBlocks, from);
            }

        }else{
            if (isToCmp) {
                removeFromArray(to.srcLines, this);
            }

            if (isFromCmp && isToCmp) {
                removeFromArray(from.destBlocks, to);
                removeFromArray(to.srcBlocks, from);
            }
        }
    };

    LineComponent.prototype.refreshTurnPoints = function(){
        var pLength  = this._points.length,
            gElem = this.element,
            elements = this.turnPointElements,
            tLength = elements.length;

        if(pLength>tLength){
            while(pLength>tLength){
                var circle = document.createElementNS(XMLNS, 'circle');

                circle.cpId = this.cpId;
                circle.setAttributeNS(null, 'r', '5');
                circle.setAttributeNS(null, 'fill', 'url(#lineTurnPoint)');

                if(!this.isFocused){
                    circle.setAttributeNS(null, 'display', 'none');
                }

                gElem.appendChild(circle);

                elements.push(circle);

                tLength++;
            }

            for (var i = 0; i < pLength; i++) {
                elements[i].cpIndex = i;
            }
        }else if(pLength<tLength){
            for(var j=pLength;j<tLength;j++){
                gElem.removeChild(elements[j]);
            }

            elements.splice(pLength,tLength-pLength);

            for (var i = 0; i < pLength; i++) {
                elements[i].cpIndex = i;
            }
        }
    };

    Object.defineProperties(LineComponent.prototype, {
        'from': {
            get: function () {
                return this._from;
            },
            set: function (value) {
                var from = this._from,
                    to = this._to;

                if (from === value) {
                    return;
                }

                if (value instanceof BlockComponent) {

                    this.clearRelatives(true);

                    from = this._from = value;

                    from.destLines.push(this);

                    if (to instanceof BlockComponent) {
                        from.destBlocks.push(to);
                        to.srcBlocks.push(from);
                    }
                } else if (typeof  value === 'object') {
                    this.clearRelatives(true);

                    this._from = value;

                }
            }
        },
        'to': {
            get: function () {
                return this._to;
            },
            set: function (value) {
                var from = this._from,
                    to = this._to;

                if (to === value) {
                    return;
                }

                if (value instanceof BlockComponent) {
                    this.clearRelatives(false);

                    to = this._to = value;

                    to.srcLines.push(this);

                    if (from instanceof BlockComponent) {
                        from.destBlocks.push(to);
                        to.srcBlocks.push(from);
                    }

                } else if (typeof value === 'object') {
                    this.clearRelatives(false);
                    this._to = value;

                }
            }
        },
        'text': {
            get: function () {
                return this._text;
            },
            set: function (value) {
                if (value === '' || value === undefined) {
                    value = null;
                }

                if (value === this._text) {
                    return;
                }

                if (value === null) {
                    this.textEl.parentNode.removeChild(this.textEl);
                    this._text = null;
                } else {
                    if (this._text === null) {
                        this.textEl = document.createElementNS(XMLNS, 'text');
                        this.textEl.setAttributeNS(null, 'text-anchor', 'middle');
                        this.textEl.setAttributeNS(null, 'font-size', TEXT_SIZE);
                        this.textEl.setAttributeNS(null, 'color', LINE_COLOR);
                        this.element.insertBefore(this.textEl, this.scopeline);

                        this.textEl.cpId = this.cpId;
                    }

                    this.textEl.innerHTML = value;
                    this._text = value;

                    locateTextEl(this.textEl, this._points[0], this._points[1]);
                }
            }
        },
        'points': {
            get: function () {
                return this._points;
            },
            set: function (value) {
                if ($.isArray(value)) {
                    this._points = value;

                    this.refreshTurnPoints();

                    var points = [];
                    var turnPoints = this.turnPointElements;
                    for (var i = 0, l = value.length; i < l; i++) {
                        var p = value[i];
                        points.push(p.x + "," + p.y);

                        var tpEl = turnPoints[i];

                        tpEl.setAttributeNS(null, 'cx', p.x);
                        tpEl.setAttributeNS(null, 'cy', p.y);
                    }

                    var str = points.join(' ');
                    this.polyline.setAttributeNS(null, 'points', str);
                    this.scopeline.setAttributeNS(null, 'points', str);

                    if (this.text !== null) {
                        locateTextEl(this.textEl, value[0], value[1]);
                    }
                }
            }
        }
    });

    function locateTextEl(textEl, first, second) {
        var rotate = angleFromVertical(second.x - first.x, -second.y + first.y),
            x = second.x / 2 + first.x / 2,
            y = second.y / 2 + first.y / 2;

        if (rotate < 45) {
            textEl.style['writing-mode'] = 'tb';
            x += 8;
        } else if (rotate < 135) {
            rotate = rotate - 90;
            textEl.style['writing-mode'] = '';
            y -= 8;
        } else {
            rotate = rotate - 180;
            textEl.style['writing-mode'] = 'tb';
            x += 8;
        }

        textEl.setAttributeNS(null, 'x', x);
        textEl.setAttributeNS(null, 'y', y);
        textEl.setAttributeNS(null, 'transform', 'rotate(' + rotate + ' ' + x + ' ' + y + ')');
    }

    function getJunctionInComponent(component, point) {
        var shiftX = point.x - component.x,
            shiftY = point.y - component.y;

        var ang = angleFromZero(shiftX, -shiftY);
        var clockIndex = getClockIndex(ang, component.angleLimit);
        return getPositionByClock(clockIndex, component);
    }

    function angleFromZero(x, y) {
        var cos = y / Math.sqrt(x * x + y * y);

        var ang = Math.acos(cos);
        if (x < 0) {
            ang = Math.PI * 2 - ang;
        }
        return ang;
    }

    function distanceFromPointToLine(point, lineStart, lineEnd) {
        /*var _x = lineEnd.x-lineStart.x,_y=lineEnd.y-lineStart.y;
         var a1 = _x,b1=_y,c1=-point.x*_x-point.y*_y;
         var k = _y/_x;
         var a2 = k,b2 = -1,c2 = lineEnd.y-k*lineEnd.x;
         var targetX = (c2*b1-c1*b2)/(a1*b2-a2*b1),
         targetY = -(a1*targetX+c1)/b1;
         return {x:Number(targetX.toFixed(0)),y:Number(targetY.toFixed(0))};*/
        var x1 = lineEnd.x - lineStart.x, y1 = lineEnd.y - lineStart.y,
            x2 = point.x - lineEnd.x, y2 = point.y - lineEnd.y,
            x3 = lineStart.x - point.x, y3 = lineStart.y - point.y;


        if ((x1 * x2 + y1 * y2) >= 0) {
            return x2 * x2 + y2 * y2;
        } else if ((x1 * x3 + y1 * y3) >= 0) {
            return x3 * x3 + y3 * y3;
        } else if (x1 === 0) {
            return x2 * x2;
        } else {
            var a = y1, b = -x1, c = lineEnd.y * x1 - lineEnd.x * y1;
            var d = a * point.x + b * point.y + c;
            return d * d / (a * a + b * b);
        }
    }


    function getPositionByClock(clockIndex, cmp) {
        var x = cmp.x, y = cmp.y;

        var handle = CLOCK[clockIndex];

        if (handle.x > 0) {
            x += cmp.outterWidth / 2;
        } else if (handle.x < 0) {
            x -= cmp.outterWidth / 2;
        }

        if (handle.y > 0) {
            y += cmp.outterHeight / 2;
        } else if (handle.y < 0) {
            y -= cmp.outterHeight / 2;
        }

        return {x: x, y: y};
    }


    function getClockIndex(targetAng, angelLimit) {
        for (var i = 0; i < 8; i++) {
            var ang = angelLimit[i];
            if (targetAng < ang) {
                return i;
            }
        }
        return 0;
    }

    function angleFromVertical(x, y) {
        var cos = y / Math.sqrt(x * x + y * y);
        var ang = Math.acos(cos) * 180 / Math.PI;
        if (x < 0) {
            ang = 180 - ang;
        }
        return ang;
    }

    function removeFromArray(array, obj) {
        var i = array.indexOf(obj);

        if (i > -1) {
            array.splice(i, 1);
        }
    }
})();