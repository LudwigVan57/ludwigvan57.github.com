var isMobile = !!(new MobileDetect(window.navigator.userAgent).mobile());

(function () {
    if(isMobile){
        return;
    }

    var cursorCanvas, cursorCtx, timer = 0,
        cursorX, cursorY;

    var CURSOR_COLOR = [13, 164, 211];



    var centerGradient;

    function initCursorCanvas() {
        cursorCanvas = document.getElementById('cursorCanvas');
        cursorCtx = cursorCanvas.getContext("2d");
        document.addEventListener('mousemove', cursorMouseMove);

        centerGradient = cursorCtx.createRadialGradient(0, 0, 0, 0, 0, 8);
        centerGradient.addColorStop(0, getColor(CURSOR_COLOR,1));
        centerGradient.addColorStop(0.6, getColor(CURSOR_COLOR,0.6));
        centerGradient.addColorStop(1, getColor(CURSOR_COLOR,0));


        refreshCursor();
        startBindCursorEvent();
    }

    function refreshCursor() {
        cursorCanvas.setAttribute('width', window.innerWidth + '');
        cursorCanvas.setAttribute('height', window.innerHeight + '');
    }

    function startBindCursorEvent() {
        setInterval(update, 50);
    }

    function cursorMouseMove(e) {
        cursorX = e.clientX;
        cursorY = e.clientY;
    }

    function getRamdonAngle() {
        return Math.random() * Math.PI * 2;
    }

    var particleFactory = (function () {
        var i = 0;


        return {
            store: {},
            create: function () {
                var particle = new Particle();
                particle.id = ++i;
                particle.startX = cursorX;
                particle.startY = cursorY;
                particle.angle = getRamdonAngle();
                particle.color = CURSOR_COLOR;

                this.store[particle.id] = particle;

                return particle;
            },
            destory: function (particle) {
                delete this.store[particle.id];
            },
            createParticles: function (num) {
                for (var i = 0; i < num; i++) {
                    this.create();
                }
            }
        };
    })();

    function Particle() {
        this.id = null;
        this.startX = null;
        this.startY = null;
        this.angle = null;
        this.lifetime = 8;
        this.color = null;

        this.speed = 2;
        this.tail = Math.random()*2;

        this.isDead = false;

        this.age = 0;
    }

    Particle.prototype = {
        update: function () {
            if (this.isDead) {
                return;
            }

            if (this.age++ > this.lifetime) {
                this.isDead = true;
            }
        },
        draw: function () {
            var start = this.speed * this.age;

            var sin = Math.sin(this.angle),
                cos = Math.cos(this.angle);

            if (!this.startX || !this.startY) {
                return;
            }
            var x1 = start * sin,
                y1 = - start * cos;

            cursorCtx.beginPath();

            var opacity = 1 - Math.pow(this.age / this.lifetime, 2);
            cursorCtx.fillStyle = getColor(this.color, opacity);

            /*  cursorCtx.moveTo(x1,y1);
             cursorCtx.lineTo(x2,y2);*/
            cursorCtx.arc(x1, y1, this.tail, 0, 360, false);
            cursorCtx.fill();
        }
    };

    function getColor(color, opacity) {
        return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + opacity + ')';
    }

    function cleanCursor() {
        cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    }

    function update() {
        if (++timer > 1) {
            particleFactory.createParticles(3);
            timer = 0;
        }

        cleanCursor();

        if(!cursorX || !cursorY){
            return;
        }

        cursorCtx.beginPath();
        cursorCtx.save();
        cursorCtx.translate(cursorX,cursorY);

        cursorCtx.arc(0, 0, 8, 0, 360, false);
        cursorCtx.fillStyle = centerGradient;
        cursorCtx.fill();


        for (var id in particleFactory.store) {
            var particle = particleFactory.store[id];
            particle.update();

            if (particle.isDead) {
                particleFactory.destory(particle);
            } else {
                particle.draw();
            }
        }

        cursorCtx.restore();
    }

    initCursorCanvas();
})();

(function(){
    var $top;

    function initTopContainer(){
        $top = $('#topContainer');

        $('.artifact-list a').each(function(){
            var $this = $(this);
            addAlternate($this);
        });
    }

    function addAlternate($el){
        var offset = $el.offset();

        var $a = $('<a>');
        $a.addClass('alternate');
        $a.attr('href',$el.attr('href'));
        $a.css({top:offset.top,left:offset.left,width:$el.width(),height:$el.height()});

        $top.append($a);

        if(!isMobile){
            $a.hover(function(){
                $el.addClass('hover');
            },function(){
                $el.removeClass('hover');
            });

            $a=null;
        }
    }

    initTopContainer();
})();