/**
 * Created by zyfan on 15/3/8.
 */
(function () {
    var Color = {
        Black:'#000000',
        Gray:'#eeeeee',
        Red:'#ee0000',
        WeakRed:'#770000'
    };


    window.Canvas3d = function (canvas) {
        this.components = [];

        this.faces = [];
        this.ctx = canvas.getContext("2d");

        var w = this.width = canvas.width;
        var h = this.height = canvas.height;

        this.ctx.translate(w / 2, h / 2);

        this.translate = new Point(0, 0, 1000);
        this.quaternion = Quaternion.genarate(0, 0, 0, 1);
        this.addEvent();
    };

    Canvas3d.prototype = {
        addEvent: function () {
            var me = this,
                translate = this.translate;

            var $doc = $(document);

            $doc.on('mousewheel DOMMouseScroll',function (e) {
                var oriEvent = e.originalEvent;

                translate.z -= oriEvent.wheelDelta ||  -(oriEvent.detail*40 || 0);
                me.draw();
            });



            $doc.on("keydown", function (e) {
                switch (e.keyCode) {
                    case 87://w:上
                        translate.y -= 10;
                        break;
                    case 83://s:下
                        translate.y += 10;
                        break;
                    case 65://a:左
                        translate.x -= 10;
                        break;
                    case 68://d:右
                        translate.x += 10;
                        break;
                }
                me.draw();
            });

            var pressed = false, screenX, screenY;
            $doc.on('mousedown', function (e) {
                pressed = true;
                screenX = e.screenX;
                screenY = e.screenY;
            });

            $doc.on('mousemove', function (e) {
                if (pressed) {
                    var xDif = e.screenX - screenX,
                        yDif = e.screenY - screenY;
                    screenX = e.screenX;
                    screenY = e.screenY;

                    me.quaternion.w = -me.quaternion.w;
                    var s = me.quaternion.rotate(new Point(1, 0, 0));
                    me.quaternion.w = -me.quaternion.w;
                    me.quaternion = Quaternion.multiply(me.quaternion,
                        Quaternion.genarate(-yDif * 0.01, s.x, s.y, s.z),
                        Quaternion.genarate(xDif * 0.01, 0, 0, 1));
                    me.draw();
                }
            });

            $doc.on('mouseup', function (e) {
                pressed = false;
            });
        },
        addLine: function (a, b) {
            this.components.push(new Line(a, b));
        },
        addQuad: function (a, b, c, d) {
            var quad = new Quad(a, b, c, d,Color.Black,Color.Gray);
            this.components.push(quad);
            this.faces.push(quad);
        },
        addCube: function (a, b, c, d, center) {
            var cube = new Cube(a, b, c, d, center,Color.WeakRed,Color.Red);
            this.components.push(cube);
            this.faces.push.apply(this.faces,cube.faces);
        },
        clear: function () {
            var w = this.width,
                h = this.height;
            this.ctx.clearRect(-w / 2, -h / 2, w, h);
        },
        draw: function () {
            var quaternion = this.quaternion,
                me = this;

            this.clear();

            this.faces.forEach(function (fc) {
                fc.distance = Math.max(distanceBetweenPoints(quaternion.rotate(fc.a), eyePoint),
                    distanceBetweenPoints(quaternion.rotate(fc.b), eyePoint),
                    distanceBetweenPoints(quaternion.rotate(fc.c), eyePoint),
                    distanceBetweenPoints(quaternion.rotate(fc.d), eyePoint));
            });

            this.faces.sort(function(a,b){
                return -a.distance + b.distance;
            });

            this.faces.forEach(function(fc){
                me.drawFace(fc.a,fc.b,fc.c,fc.d,fc.strokeStyle,fc.fillStyle);
            });
        },
        transformPoint: function (point) {
            var target = Point.sum(this.translate, point);
            var x = (target.z * eyePoint.x - target.x * eyePoint.z) / (target.z - eyePoint.z);
            var y = (target.z * eyePoint.y - target.y * eyePoint.z) / (target.z - eyePoint.z);
            return new Point(x, y, 0);
        },
        drawFace: function (a, b, c, d, fillStyle, strokeStyle) {
            var quaternion = this.quaternion;
            a = this.transformPoint(quaternion.rotate(a)),
                b = this.transformPoint(quaternion.rotate(b)),
                c = this.transformPoint(quaternion.rotate(c)),
                d = this.transformPoint(quaternion.rotate(d));
            var ctx = this.ctx;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);

            ctx.lineTo(b.x, b.y);
            ctx.lineTo(c.x, c.y);
            ctx.lineTo(d.x, d.y);
            ctx.lineTo(a.x, a.y);

            ctx.fillStyle = fillStyle ? fillStyle : "#eeeeee";
            ctx.strokeStyle = strokeStyle ? strokeStyle : "#000000";

            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        },
        drawLine: function (line) {
            var quaternion = this.quaternion;
            var start = this.transformPoint(quaternion.rotate(line.a)),
                end = this.transformPoint(quaternion.rotate(line.b));
            var ctx = this.ctx;

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    };

    function distanceBetweenPoints(point1, point2) {
        var x = point1.x - point2.x,
            y = point1.y - point2.y,
            z = point1.z - point2.z;
        return x * x + y * y + z * z;
    }


    /********************** 点 **********************/
    window.Point = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    Point.check = function (point) {
        if (point instanceof Point)
            return point;
        else
            return new Point(0, 0, 0);
    };

    Point.sum = function () {
        var x = 0, y = 0, z = 0;
        for (var i = 0, l = arguments.length; i < l; i++) {
            var arg = arguments[i];
            x += arg.x;
            y += arg.y;
            z += arg.z;
        }
        return new Point(x, y, z);
    };

    /********************** 组件 **********************/
    window.Line = function (a, b) {
        this.a = a;
        this.b = b;
    };

    //四边形
    window.Quad = function (a, b, c, d, strokeStyle, fillStyle) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;

        this.strokeStyle = strokeStyle;
        this.fillStyle = fillStyle;
    };

    //长方体
    window.Cube = function (p0, p1, p2, p3, center, strokeStyle, fillStyle) {
       // this.points = [[], []];
        this.faces = [];
        this.center = center;

        this.strokeStyle = strokeStyle;
        this.fillStyle = fillStyle;

        var p4 = getCorrespondingPoint(p2, center),
            p5 = getCorrespondingPoint(p3, center),
            p6 = getCorrespondingPoint(p0, center),
            p7 = getCorrespondingPoint(p1, center);

        this.faces.push(new Quad(p0,p1,p2,p3,strokeStyle,fillStyle));
        this.faces.push(new Quad(p4,p5,p6,p7,strokeStyle,fillStyle));
        this.faces.push(new Quad(p0,p1,p5,p4,strokeStyle,fillStyle));
        this.faces.push(new Quad(p1,p2,p6,p5,strokeStyle,fillStyle));
        this.faces.push(new Quad(p2,p3,p7,p6,strokeStyle,fillStyle));
        this.faces.push(new Quad(p3,p0,p4,p7,strokeStyle,fillStyle));
    };

    Cube.prototype = {
        getAdjacentFace: function (r, c) {
            var result = [];

            result.push([this.getPoint(r, c), this.getPoint(r, c + 1), this.getPoint(r + 1, c + 1), this.getPoint(r + 1, c)]);
            result.push([this.getPoint(r, c), this.getPoint(r, c - 1), this.getPoint(r + 1, c - 1), this.getPoint(r + 1, c)]);
            result.push([this.getPoint(r, c), this.getPoint(r, c + 1), this.getPoint(r, c + 2), this.getPoint(r, c + 3)]);
            return result;
        },
        getPoint: function (r, c) {
            if (c > 3) {
                c -= 4;
            } else if (c < 0) {
                c += 4;
            }
            if (r > 1) {
                r -= 2;
            } else if (r < 0) {
                r += 2;
            }

            return this.points[r][c];
        }
    };


    function getCorrespondingPoint(point, centerPoint) {
        var x = centerPoint.x * 2 - point.x,
            y = centerPoint.y * 2 - point.y,
            z = centerPoint.z * 2 - point.z;
        return new Point(x, y, z);
    }


    //人眼坐标
    var eyePoint = new Point(0, 0, -2000);

    /********************** 四元数 **********************/
    var Quaternion = function (w, x, y, z) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    };

    Quaternion.prototype = {
        commonRail: function () {
            return new Quaternion(this.w, -this.x, -this.y, -this.z);
        },
        norm: function () {
            return this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
        },
        inverse: function () {
            var n = this.norm();
            return new Quaternion(this.w / n, -this.x / n, -this.y / n, -this.z / n);
        },
        rotate: function (point) {
            var p = new Quaternion(0, point.x, point.y, point.z),
                q = Quaternion.multiply(this, p, this.inverse());
            return new Point(q.x, q.y, q.z);
        }
    };

    Quaternion.multiply = function (q1, q2) {
        var w = q1.w, x = q1.x, y = q1.y, z = q1.z;

        for (var i = 1, l = arguments.length; i < l; i++) {
            var arg = arguments[i];
            var a_w = arg.w, a_x = arg.x, a_y = arg.y, a_z = arg.z;
            var w1 = w * a_w - x * a_x - y * a_y - z * a_z,
                x1 = w * a_x + x * a_w + z * a_y - y * a_z,
                y1 = w * a_y + y * a_w + x * a_z - z * a_x,
                z1 = w * a_z + z * a_w + y * a_x - x * a_y;
            w = w1;
            x = x1;
            y = y1;
            z = z1;
        }

        return new Quaternion(w, x, y, z);
    };

    Quaternion.genarate = function (deg, x, y, z) {
        deg = deg / 2;
        var cos = Math.cos(deg),
            sin = Math.sin(deg);
        return new Quaternion(cos, sin * x, sin * y, sin * z);
    };

})();