

var canvas;
var gl;

var points = [];
var normals = [];


var near = -10;
var far = 10;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -1.0;
var right = 1.0;
var ytop =1.0;
var bottom = -1.0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);
    
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.9, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.5, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var ctm;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    
    o = new Obstacle(vec3(0,0,0), .5, .15, 75);
    o2 = new Obstacle(vec3(.5,.5,0), .25, .25, 75);
    o.calculateShape();
    o2.calculateShape();

    points = o.points.concat(o2.points);
    normals = o.normals.concat(o2.normals);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    document.getElementById("Button0").onclick = function(){radius *= 2.0;};
    document.getElementById("Button1").onclick = function(){radius *= 0.5;};
    document.getElementById("Button2").onclick = function(){theta += dr;};
    document.getElementById("Button3").onclick = function(){theta -= dr;};
    document.getElementById("Button4").onclick = function(){phi += dr;};
    document.getElementById("Button5").onclick = function(){phi -= dr;};


    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );

    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    for( var i=0; i<points.length; i+=3) 
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    window.requestAnimFrame(render);
}


//Define new Classes
//-------------------------------------------------------
//

/*
Obstacle. This object will be the obstacle for the pinball game. It will be an ellipse outside with half circle cutout inside.
center is the defined center point of the semicircle cut into the edge and the outer edge which is the ellipse.
*/
function Obstacle(center, radius, height, divisions) {
    this.center = center;
    this.radius = radius;
    this.height = height;
    this.divisions = divisions;
    this.normals = [];
    this.points = [];
}

Obstacle.prototype.calculateShape = function() {
    ellipsePoints = ellipse(this.center, 3*this.radius, this.radius, -1*Math.PI/2, Math.PI/2, Math.PI/this.divisions);
    circlePoints = ellipse(this.center, this.radius, this.radius, -1*Math.PI/2, Math.PI/2, Math.PI/this.divisions);

    this.getSidePanel(ellipsePoints, circlePoints);
    this.getTopAndBottomPanels(ellipsePoints, circlePoints);
    
}

Obstacle.prototype.getTopAndBottomPanels = function(ellipsePoints, circlePoints) {

    for (var i=0; i<ellipsePoints.length -1; i++) {
        p1 = vec4(circlePoints[i][0], circlePoints[i][1], this.center[2]+this.height/2,1);
        p2 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], this.center[2]+this.height/2,1);
        p3 = vec4(ellipsePoints[i][0], ellipsePoints[i][1], this.center[2]+this.height/2,1);
        p4 = vec4(ellipsePoints[i+1][0], ellipsePoints[i+1][1], this.center[2]+this.height/2,1);
        this.points = this.points.concat([p1,p4,p3]);
        this.points = this.points.concat([p1,p2,p4]);
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);

        p1 = vec4(circlePoints[i][0], circlePoints[i][1], this.center[2]-this.height/2,1);
        p2 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], this.center[2]-this.height/2,1);
        p3 = vec4(ellipsePoints[i][0], ellipsePoints[i][1], this.center[2]-this.height/2,1);
        p4 = vec4(ellipsePoints[i+1][0], ellipsePoints[i+1][1], this.center[2]-this.height/2,1);
        this.points = this.points.concat([p1,p4,p3]);
        this.points = this.points.concat([p1,p2,p4]);
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);
    }
}

Obstacle.prototype.getSidePanel = function(ellipsePoints, circlePoints) {
    for (var i=0; i<circlePoints.length-1; i++) {
        p1 = vec4(circlePoints[i][0], circlePoints[i][1], this.center[2]+this.height/2, 1);
        p2 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], this.center[2]+this.height/2, 1);
        p3 = vec4(circlePoints[i][0], circlePoints[i][1], this.center[2]-this.height/2, 1);
        p4 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], this.center[2]-this.height/2, 1);
        this.points = this.points.concat([p1,p4,p2]);
        this.points = this.points.concat([p1,p3,p4]);
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);
    }
    for (var i=0; i<ellipsePoints.length-1; i++) {
        p1 = vec4(ellipsePoints[i][0], ellipsePoints[i][1], this.center[2]+this.height/2, 1);
        p2 = vec4(ellipsePoints[i+1][0], ellipsePoints[i+1][1], this.center[2]+this.height/2, 1);
        p3 = vec4(ellipsePoints[i][0], ellipsePoints[i][1], this.center[2]-this.height/2, 1);
        p4 = vec4(ellipsePoints[i+1][0], ellipsePoints[i+1][1], this.center[2]-this.height/2, 1);
        this.points = this.points.concat([p1,p4,p2]);
        this.points = this.points.concat([p1,p3,p4]);
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);
    }
}

/*
Generates a list of points around the edge of an ellipse in 2 space.
*/
function ellipse(centerPoint, yRadius, xRadius, startTheta, endTheta, stepTheta) {
    var ellipsePoints = [];
    var currentTheta = startTheta;
    while (currentTheta < endTheta) {
        ellipsePoints.push(vec2(xRadius*Math.sin(currentTheta) + centerPoint[0], yRadius*Math.cos(currentTheta)+centerPoint[1]));
        currentTheta += stepTheta;
    }
    return ellipsePoints;
}
