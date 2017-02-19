(function(){
    var canvas = $("#canvas");

    canvas.attr({width:$(window).width(),height:($('.fixed-bottom').height()-$('.desc').height())});

    var canvas3d = new Canvas3d(canvas[0]);

    var meshSize = 50,size = 2,cubeNum = 2;

    function startDraw(){
        var array = [];

        for(var i=-size+1;i<size;i++){
            for(var j=-size+1;j<size;j++){
                addPark(i,j);
                array.push([i,j]);
            }
        }

        for(var c=0;c<cubeNum;c++){
            addCube.apply(this, getOneQuad(array)[0]);
        }

        canvas3d.draw();
    }

    function getOneQuad(array){
        return array.splice(getRandomBetween(0,array.length-1),1);
    }

    function getRandomBetween(min,max){
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    function addCube(x,y){
        var centerX = 2*x*meshSize,
            centerY = 2*y*meshSize;

        canvas3d.addCube(new Point(centerX-meshSize,centerY+meshSize,-1),new Point(centerX+meshSize,centerY+meshSize,-1),
            new Point(centerX+meshSize,centerY-meshSize,-1),new Point(centerX-meshSize,centerY-meshSize,-1),
        new Point(centerX,centerY,-meshSize-1));
    }

    function addPark(x,y){
        var centerX = 2*x*meshSize,
            centerY = 2*y*meshSize;

        canvas3d.addQuad(new Point(centerX-meshSize,centerY+meshSize,0),new Point(centerX+meshSize,centerY+meshSize,0),
            new Point(centerX+meshSize,centerY-meshSize,0),new Point(centerX-meshSize,centerY-meshSize,0));
    }


    startDraw();
})();