(function(){
    var canvas = $("#canvas");

    canvas.attr({width:$(window).width(),height:($('.fixed-bottom').height()-$('.desc').height())});


    var size = 50;

    var canvas3d = new Canvas3d(canvas[0]);

    function startDraw(){
        var num = 1;
        for(var i=-num;i<=num;i=i+1){
            for(var j=-num;j<=num;j=j+1){
                addPark(i,j);
            }
        }

        addCube(0,0);
        canvas3d.draw();
    }

    function addCube(x,y){
        var centerX = 2*x*size,
            centerY = 2*y*size;

        canvas3d.addCube(new Point(centerX-size,centerY+size,-1),new Point(centerX+size,centerY+size,-1),
            new Point(centerX+size,centerY-size,-1),new Point(centerX-size,centerY-size,-1),
        new Point(centerX,centerX,-size-1));
    }

    function addPark(x,y){
        var centerX = 2*x*size,
            centerY = 2*y*size;

        canvas3d.addQuad(new Point(centerX-size,centerY+size,0),new Point(centerX+size,centerY+size,0),
            new Point(centerX+size,centerY-size,0),new Point(centerX-size,centerY-size,0));
    }


    startDraw();
})();