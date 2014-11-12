var GRAY = new vec4(125/255,125/255,125/255);
var GREEN = new vec4(.2, 1, .2, 1);
var SAND = new vec4(237/255, 201/255, 175/255, 1);
var f;
var obstacles;
var ball;

var ballRadius = .03;

var points = [];
var normals = [];


var near = -10;
var far = 10;
var radius2 = 1.5;
var theta2  = 0.0;
var phi2    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -1.0;
var right = 1.0;
var ytop =1.0;
var bottom = -1.0;

var va = vec4(0.1, 0.0, -1.0,1);
var vb = vec4(0.1, 0.942809, 0.333333, 1);
var vc = vec4(-0.716497, -0.471405, 0.333333, 1);
var vd = vec4(0.916497, -0.471405, 0.333333,1);

var lightPosition = vec4(0.5, 1.0, 1.0, 0.0 );
var dlp = .1;
var lightAmbient = vec4(0.2, 0.9, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.5, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 80.0;

var ctm;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var canvas;
var gl;

var numVertices  = 36;

var texSize = 256;
var numChecks = 8;

var program1, program2;

var texture1, texture2;
var t1, t2;

var c;

var flag = true;

var image1 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image1[4*i*texSize+4*j] = c;
            image1[4*i*texSize+4*j+1] = c;
            image1[4*i*texSize+4*j+2] = c;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }

var image2 = new Uint8Array(4*texSize*texSize);

    // Create a checkerboard pattern
    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            image2[4*i*texSize+4*j] = 127+127*Math.sin(0.1*i*j);
            image2[4*i*texSize+4*j+1] = 127+127*Math.sin(0.1*i*j);
            image2[4*i*texSize+4*j+2] = 127+127*Math.sin(0.1*i*j);
            image2[4*i*texSize+4*j+3] = 255;
           }
    }

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var BOTTOM_LEFT = texCoord[0];
var TOP_LEFT = texCoord[1];
var BOTTOM_RIGHT = texCoord[3];
var TOP_RIGHT = texCoord[2];


var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [-20, 180, 0];
theta = [0,180,0];
var dTheta = 10;
var thetaLoc;
var thetaLoc2;

function configureTexture() {
    texture1 = gl.createTexture();
	var image = new Image();
	image.crossOrigin = '';
	image.onload = function() { 
		gl.bindTexture (gl.TEXTURE_2D, texture1);
		gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
		gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}
	image.src = "Grass.gif";
	
    /*texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);*/

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

var vTexCoord;
var tBuffer;
var vPosition;
var vBuffer;
var vColor;
var cBuffer;

function bindField() {
    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(f.colors), gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program1, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(f.points), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program1, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(f.textures), gl.STATIC_DRAW );

    vTexCoord = gl.getAttribLocation( program1, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program1, "Tex0"), 0);

	gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program1, "Tex1"), 1);

    thetaLoc = gl.getUniformLocation(program1, "theta");
}

var nBuffer2;
var vNormal2;
var vBuffer2;
var vPosition2;

function bindLight() {
    nBuffer2 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    vNormal2 = gl.getAttribLocation( program2, "vNormal" );
    gl.vertexAttribPointer( vNormal2, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal2);


    vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    vPosition2 = gl.getAttribLocation( program2, "vPosition");
    gl.vertexAttribPointer(vPosition2, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition2);

    modelViewMatrixLoc = gl.getUniformLocation( program2, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program2, "projectionMatrix" );

    gl.uniform4fv( gl.getUniformLocation(program2,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program2,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program2,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program2,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program2,
       "shininess"),materialShininess );
    thetaLoc2 = gl.getUniformLocation(program2, "theta");
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    document.getElementById("Button0").onclick = function(){theta[0] = theta[0] + dTheta};
    document.getElementById("Button1").onclick = function(){theta[0] = theta[0] - dTheta};
    document.getElementById("Button2").onclick = function(){theta[1] = theta[1] + dTheta};
    document.getElementById("Button3").onclick = function(){theta[1] = theta[1] - dTheta};
    document.getElementById("Button4").onclick = function(){theta[2] = theta[2] + dTheta};
    document.getElementById("Button5").onclick = function(){theta[2] = theta[2] - dTheta};


    document.getElementById("ButtonLight0").onclick = function(){lightPosition[0] = lightPosition[0] + dlp};
    document.getElementById("ButtonLight1").onclick = function(){lightPosition[0] = lightPosition[0] - dlp};
    document.getElementById("ButtonLight2").onclick = function(){lightPosition[1] = lightPosition[1] + dlp};
    document.getElementById("ButtonLight3").onclick = function(){lightPosition[1] = lightPosition[1] - dlp};
    document.getElementById("ButtonLight4").onclick = function(){lightPosition[2] = lightPosition[2] + dlp};
    document.getElementById("ButtonLight5").onclick = function(){lightPosition[2] = lightPosition[2] - dlp};

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program1 = initShaders( gl, "vertex-shader_texture", "fragment-shader_texture" );
    gl.useProgram( program1 );

    f = new Field(vec3(0,-1,0), 1.7, 1.67, 1.7, .3);
    f.calculateShape();

    configureTexture();

    program2 = initShaders( gl, "vertex-shader_light", "fragment-shader_light" );
    gl.useProgram(program2);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    bat = new Bat(vec3(-1/5,-1+(5/15),-.1), 1/60, .05, .25, 75, - Math.PI / 6);
    bat.calculateShape();

    obstacles = [];
    obstacles.push(new Obstacle(vec3(0, -.4, -.09), ballRadius, .1, 75));
    obstacles.push(new Obstacle(vec3(-.15, -.25,-.09), ballRadius, .1, 75, -1*Math.PI/6));
    obstacles.push(new Obstacle(vec3(.15, -.25, -.09), ballRadius, .1, 75, Math.PI/6));
    obstacles.push(new Obstacle(vec3(-.3, -.4, -.09), ballRadius, .1, 75, -1*Math.PI/4));
    obstacles.push(new Obstacle(vec3(.3, -.4, -.09), ballRadius, .1, 75, Math.PI/4));
    obstacles.push(new Obstacle(vec3(0, .4, -.09), ballRadius, .1, 75));
    obstacles.push(new Obstacle(vec3(-.5, .25, -.09), ballRadius, .1, 75, -1*Math.PI/4));
    obstacles.push(new Obstacle(vec3(.5, .25, -.09), ballRadius, .1, 75, Math.PI/4));

    obstaclePoints = [];
    obstacleNormals = [];
    for (var i=0; i< obstacles.length; i++) {
      obstacles[i].calculateShape();
      obstaclePoints = obstaclePoints.concat(obstacles[i].points);
      obstacleNormals = obstacleNormals.concat(obstacles[i].normals);
    }

    ball = new Ball(vec4(.3, .2, 0, 0),ballRadius, 5);
    ball.calculateShape();

    points = bat.points.concat(obstaclePoints).concat(ball.pointsArray);
    normals = bat.normals.concat(obstacleNormals).concat(ball.normalsArray);
	
    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram( program1 );
    bindField();
    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays( gl.TRIANGLES, 0, f.points.length );

    gl.useProgram(program2);
    bindLight();
    eye = vec3(radius2*Math.sin(theta2)*Math.cos(phi2),
    radius2*Math.sin(theta2)*Math.sin(phi2), radius2*Math.cos(theta2));

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniform3fv(thetaLoc2, theta);
    for( var i=0; i<points.length; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    requestAnimFrame(render);
}

/*
Add the code for the field object and associated information
*/

/*
Generates a list of points around the edge of an ellipse in 2 space.
*/
function ellipse(centerPoint, yRadius, xRadius, startTheta, endTheta, stepTheta, offsetTheta) {
    var ellipsePoints = [];
    offsetTheta = 0;
    var currentTheta = startTheta + offsetTheta;
    endTheta = endTheta + offsetTheta;
    while (currentTheta < endTheta) {
        ellipsePoints.push(vec2(xRadius*Math.sin(currentTheta) + centerPoint[0], yRadius*Math.cos(currentTheta)+centerPoint[1]));
        currentTheta += stepTheta;
    }
    return ellipsePoints;
};

function ellipseWithRotation(centerPoint, yRadius, xRadius, startTheta, endTheta, stepTheta, angle) {
    var ellipsePoints = [];
    var currentTheta = startTheta;
    while (currentTheta < endTheta) {
		ellipsePoints.push(vec2(
		Math.cos(angle)*xRadius*Math.cos(currentTheta) + Math.sin(-1*angle)*yRadius*Math.sin(currentTheta) + centerPoint[0],
		Math.sin(angle)*xRadius*Math.cos(currentTheta) + Math.cos(-1*angle)*yRadius*Math.sin(currentTheta) + centerPoint[1]));
		currentTheta += stepTheta;
    }
    return ellipsePoints;
};

function Field(centerPoint, centerFieldWall, rightFieldWall, leftFieldWall, height) {
    this.centerPoint = centerPoint;
    this.xleft = Math.cos(Math.PI/5)*leftFieldWall;
    this.xright = Math.cos(Math.PI/5)*rightFieldWall;
    this.y = centerFieldWall;
    this.points = [];
    this.textures = [];
    this.colors = [];
    this.height = height;
};

Field.prototype.calculateShape = function() {
    var ellipsePoints = ellipse(this.centerPoint, this.y, this.xleft, -1*Math.PI/4, 0, .1).concat(ellipse(this.centerPoint, this.y, this.xright, 0, Math.PI/4, .1));

    this.addCurvedWall(ellipsePoints);
    this.addFlatWalls(ellipsePoints);
    this.addFloor(ellipsePoints);
};

Field.prototype.addCurvedWall = function(ellipsePoints) {
    for (i=0; i<ellipsePoints.length-1; i++) {
        p1 = new vec4(ellipsePoints[i][0], ellipsePoints[i][1], this.centerPoint[2] + this.height/2, 1);
        p2 = new vec4(ellipsePoints[i+1][0], ellipsePoints[i+1][1], this.centerPoint[2] + this.height/2, 1);
        p3 = new vec4(ellipsePoints[i][0], ellipsePoints[i][1], this.centerPoint[2] - this.height/2, 1);
        p4 = new vec4(ellipsePoints[i+1][0], ellipsePoints[i+1][1], this.centerPoint[2] - this.height/2, 1);

        this.points = this.points.concat([p1,p4,p2]).concat([p1,p3,p4]);
        this.colors = this.colors.concat([GRAY,GRAY,GRAY]).concat([GRAY,GRAY,GRAY]);
        this.textures = this.textures.concat([TOP_LEFT, BOTTOM_RIGHT, TOP_RIGHT]).concat([TOP_LEFT, BOTTOM_LEFT, BOTTOM_RIGHT]);

    }
}

Field.prototype.addFlatWalls = function(ellipsePoints) {
    p1 = new vec4(ellipsePoints[0][0], ellipsePoints[0][1], this.centerPoint[2] + this.height/2, 1);
    p2 = new vec4(ellipsePoints[0][0], ellipsePoints[0][1], this.centerPoint[2] - this.height/2, 1);
    p3 = new vec4(this.centerPoint[0], this.centerPoint[1], this.centerPoint[2]+this.height/2, 1);
    p4 = new vec4(this.centerPoint[0], this.centerPoint[1], this.centerPoint[2]-this.height/2, 1);
    p5 = new vec4(ellipsePoints[ellipsePoints.length-1][0], ellipsePoints[ellipsePoints.length-1][1], this.centerPoint[2] + this.height/2, 1);
    p6 = new vec4(ellipsePoints[ellipsePoints.length-1][0], ellipsePoints[ellipsePoints.length-1][1], this.centerPoint[2] - this.height/2, 1);

    this.points = this.points.concat([p1,p2,p4]).concat([p1,p4,p3]);
    this.colors = this.colors.concat([GRAY,GRAY,GRAY]).concat([GRAY,GRAY,GRAY]);
    this.textures = this.textures.concat([TOP_LEFT, BOTTOM_LEFT, BOTTOM_RIGHT]).concat([TOP_LEFT, BOTTOM_RIGHT, TOP_RIGHT]);

    this.points = this.points.concat([p5, p3, p4]).concat([p5, p4, p6]);
    this.colors = this.colors.concat([GRAY,GRAY,GRAY]).concat([GRAY,GRAY,GRAY]);
    this.textures = this.textures.concat([TOP_RIGHT, TOP_LEFT, BOTTOM_LEFT]).concat([TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT]);
}

Field.prototype.addFloor = function(ellipsePoints) {
    var p1 = new vec4(this.centerPoint[0], this.centerPoint[1], this.centerPoint[2]-this.height/2, 1);
    for (i=0; i<ellipsePoints.length-1; i++) {
        p2 = new vec4(ellipsePoints[i][0], ellipsePoints[i][1], this.centerPoint[2] - this.height/2, 1);
        p3 = new vec4(ellipsePoints[i+1][0], ellipsePoints[i+1][1], this.centerPoint[2] - this.height/2, 1);

        this.points = this.points.concat([p1,p3,p2]);
        this.colors = this.colors.concat([SAND, GREEN, GREEN]);
        this.textures = this.textures.concat([BOTTOM_LEFT, TOP_RIGHT, TOP_LEFT]);
    }
};

function Obstacle(center, radius, height, divisions, offsetTheta) {
    this.center = center;
    this.radius = radius;
    this.height = height;
    this.divisions = divisions;
    this.normals = [];
    this.points = [];
    this.offsetTheta = offsetTheta;
}

Obstacle.prototype.calculateShape = function() {
    ellipsePoints = ellipse(this.center, 3*this.radius, this.radius, -1*Math.PI/2, Math.PI/2, Math.PI/this.divisions, this.offsetTheta);
    circlePoints = ellipse(this.center, this.radius, this.radius, -1*Math.PI/2, Math.PI/2, Math.PI/this.divisions, this.offsetTheta);

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

function Bat(knobCenter, radius, height, batLength, divisions, angle) {
    this.knobCenter = knobCenter;
    this.radius = radius;
    this.height = height;
	this.batLength = batLength;
    this.divisions = divisions;
    this.normals = [];
    this.points = [];
	this.batAngle = angle;
};

Bat.prototype.calculateShape = function() {
    elipse1 = ellipseWithRotation(this.knobCenter, 2*this.radius, this.radius, 0, 2 * Math.PI, 2 * Math.PI/this.divisions, this.batAngle);
	var endCenter =[this.knobCenter[0]+(this.batLength * Math.cos(this.batAngle)), this.knobCenter[1]+(this.batLength * Math.sin(this.batAngle)), this.knobCenter[2]];
	elipse2 = ellipseWithRotation(endCenter, 3*this.radius, 2*this.radius, 0, 2*Math.PI, 2 * Math.PI/this.divisions, this.batAngle);
    this.getTopAndBottomCirclePanels(this.knobCenter, elipse1);
	this.getTopAndBottomBarrelPanels(this.knobCenter, endCenter);
	this.getTopAndBottomCirclePanels(endCenter, elipse2);

    this.getSideCirclePanel(this.knobCenter, elipse1);
	this.getSideBarrelPanel(this.knobCenter, endCenter);
	this.getSideCirclePanel(endCenter, elipse2);
};

Bat.prototype.getTopAndBottomCirclePanels = function(centerPoint, circlePoints) {

    for (var i=0; i<circlePoints.length - 1; i++) {
        p1 = vec4(centerPoint[0], centerPoint[1], centerPoint[2]+this.height/2,1);
        p2 = vec4(circlePoints[i][0], circlePoints[i][1], centerPoint[2]+this.height/2,1);
        p3 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], centerPoint[2]+this.height/2,1);
        this.points = this.points.concat([p1,p3,p2]);
        var t1 = subtract(p3, p1);
        var t2 = subtract(p2, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal]);

        p1 = vec4(centerPoint[0], centerPoint[1], centerPoint[2]-this.height/2,1);
        p2 = vec4(circlePoints[i][0], circlePoints[i][1], centerPoint[2]-this.height/2,1);
        p3 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], centerPoint[2]-this.height/2,1);
        this.points = this.points.concat([p1,p3,p2]);
        var t1 = subtract(p3, p1);
        var t2 = subtract(p2, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal]);
    }

	p1 = vec4(centerPoint[0], centerPoint[1], centerPoint[2]+this.height/2,1);
	p2 = vec4(circlePoints[i][0], circlePoints[i][1], centerPoint[2]+this.height/2,1);
	p3 = vec4(circlePoints[0][0], circlePoints[0][1], centerPoint[2]+this.height/2,1);
	this.points = this.points.concat([p1,p3,p2]);
	var t1 = subtract(p3, p1);
	var t2 = subtract(p2, p1);
	var normal = normalize(cross(t1, t2));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal]);

	p1 = vec4(centerPoint[0], centerPoint[1], centerPoint[2]-this.height/2,1);
	p2 = vec4(circlePoints[i][0], circlePoints[i][1], centerPoint[2]-this.height/2,1);
	p3 = vec4(circlePoints[0][0], circlePoints[0][1], centerPoint[2]-this.height/2,1);
	this.points = this.points.concat([p1,p3,p2]);
  var t1 = subtract(p3, p1);
  var t2 = subtract(p2, p1);
	var normal = normalize(cross(t1, t2));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal]);
};

Bat.prototype.getTopAndBottomBarrelPanels = function(knob, end) {
	p1 = vec4(knob[0] + Math.sin(-1*this.batAngle) * this.radius / 2,
		knob[1] + Math.cos(-1*this.batAngle) * this.radius / 2,
		knob[2] + this.height/2,1);
	p2 = vec4(end[0] + Math.sin(-1*this.batAngle) * this.radius * 3,
		end[1] + Math.cos(-1*this.batAngle) * this.radius * 3,
		end[2] + this.height/2,1);
	p3 = vec4(end[0],
		end[1],
		end[2] + this.height/2,1);
	this.points = this.points.concat([p1,p3,p2]);
	var t1 = subtract(p2,p1);
	var t2 = subtract(p3,p1);
	var normal = normalize(cross(t1, t2));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal]);

	p1 = vec4(knob[0] + Math.sin(-1*this.batAngle) * this.radius / 2,
		knob[1] + Math.cos(-1*this.batAngle) * this.radius / 2,
		knob[2] - this.height/2,1);
	p2 = vec4(end[0] + Math.sin(-1*this.batAngle) * this.radius * 3,
		end[1] + Math.cos(-1*this.batAngle) * this.radius * 3,
		end[2] - this.height/2,1);
	p3 = vec4(end[0],
		end[1],
		end[2] - this.height/2,1);
	this.points = this.points.concat([p1,p3,p2]);
	var t1 = subtract(p2,p1);
	var t2 = subtract(p3,p1);
	var normal = normalize(cross(t1, t2));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal]);

	p1 = vec4(end[0],
		end[1],
		end[2] + this.height/2,1);
	p2 = vec4(knob[0] + Math.sin(-1*this.batAngle) * this.radius / 2,
		knob[1] + Math.cos(-1*this.batAngle) * this.radius / 2,
		knob[2] + this.height/2,1);
	p3 = vec4(knob[0] - Math.sin(-1*this.batAngle) * this.radius / 2,
		knob[1] - Math.cos(-1*this.batAngle) * this.radius / 2,
		knob[2] + this.height/2,1);
	this.points = this.points.concat([p1,p3,p2]);
	var t1 = subtract(p2,p1);
	var t2 = subtract(p3,p1);
	var normal = normalize(cross(t1, t2));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal]);

	p1 = vec4(end[0],
		end[1],
		end[2] - this.height/2,1);
	p2 = vec4(knob[0] + Math.sin(-1*this.batAngle) * this.radius / 2,
		knob[1] + Math.cos(-1*this.batAngle) * this.radius / 2,
		knob[2] - this.height/2,1);
	p3 = vec4(knob[0] - Math.sin(-1*this.batAngle) * this.radius / 2,
		knob[1] - Math.cos(-1*this.batAngle) * this.radius / 2,
		knob[2] - this.height/2,1);
	this.points = this.points.concat([p1,p3,p2]);
	var t1 = subtract(p2,p1);
	var t2 = subtract(p3,p1);
	var normal = normalize(cross(t1, t2));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal]);

	p1 = vec4(knob[0] - Math.sin(-1*this.batAngle) * this.radius / 2,
		knob[1] - Math.cos(-1*this.batAngle) * this.radius / 2,
		knob[2] + this.height/2,1);
	p2 = vec4(end[0],
		end[1],
		end[2] + this.height/2,1);
	p3 = vec4(end[0] - Math.sin(-1*this.batAngle) * this.radius * 3,
		end[1] - Math.cos(-1*this.batAngle) * this.radius * 3,
		end[2] + this.height/2,1);
	this.points = this.points.concat([p1,p3,p2]);
	var t1 = subtract(p2,p1);
	var t2 = subtract(p3,p1);
	var normal = normalize(cross(t1, t2));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal]);

	p1 = vec4(knob[0] - Math.sin(-1*this.batAngle) * this.radius / 2,
		knob[1] - Math.cos(-1*this.batAngle) * this.radius / 2,
		knob[2] - this.height/2,1);
	p2 = vec4(end[0],
		end[1],
		end[2] - this.height/2,1);
	p3 = vec4(end[0] - Math.sin(-1*this.batAngle) * this.radius * 3,
		end[1] - Math.cos(-1*this.batAngle) * this.radius * 3,
		end[2] - this.height/2,1);
	this.points = this.points.concat([p1,p3,p2]);
	var t1 = subtract(p2,p1);
	var t2 = subtract(p3,p1);
	var normal = normalize(cross(t1, t2));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal]);
};

Bat.prototype.getSideCirclePanel = function(center, circlePoints) {
    for (var i=0; i<circlePoints.length-1; i++) {
        p1 = vec4(circlePoints[i][0], circlePoints[i][1], center[2]+this.height/2, 1);
        p2 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], center[2]+this.height/2, 1);
        p3 = vec4(circlePoints[i][0], circlePoints[i][1], center[2]-this.height/2, 1);
        p4 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], center[2]-this.height/2, 1);
        this.points = this.points.concat([p1,p4,p2]);
        this.points = this.points.concat([p1,p3,p4]);
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);
    }
};

Bat.prototype.getSideBarrelPanel = function(center, endCenter) {
	p1 = vec4(center[0] + Math.sin(-1*this.batAngle) * this.radius / 2,
		center[1] + Math.cos(-1*this.batAngle) * this.radius / 2,
		center[2] + this.height/2,1);
	p2 = vec4(endCenter[0] + Math.sin(-1*this.batAngle) * this.radius * 3,
		endCenter[1] + Math.cos(-1*this.batAngle) * this.radius * 3,
		endCenter[2] + this.height/2,1);
	p3 = vec4(center[0] + Math.sin(-1*this.batAngle) * this.radius / 2,
		center[1] + Math.cos(-1*this.batAngle) * this.radius / 2,
		center[2] - this.height/2,1);
	p4 = vec4(endCenter[0] + Math.sin(-1*this.batAngle) * this.radius * 3,
		endCenter[1] + Math.cos(-1*this.batAngle) * this.radius * 3,
		endCenter[2] - this.height/2,1);
	this.points = this.points.concat([p1,p4,p2]);
	this.points = this.points.concat([p1,p3,p4]);
	var t1 = subtract(p2, p1);
	var t2 = subtract(p3, p1);
	var normal = normalize(cross(t2, t1));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);

	p1 = vec4(center[0] - Math.sin(-1*this.batAngle) * this.radius / 2,
		center[1] - Math.cos(-1*this.batAngle) * this.radius / 2,
		center[2] - this.height/2,1);
	p2 = vec4(endCenter[0] - Math.sin(-1*this.batAngle) * this.radius * 3,
		endCenter[1] - Math.cos(-1*this.batAngle) * this.radius * 3,
		endCenter[2] - this.height/2,1);
	p3 = vec4(center[0] - Math.sin(-1*this.batAngle) * this.radius / 2,
		center[1] - Math.cos(-1*this.batAngle) * this.radius / 2,
		center[2] + this.height/2,1);
	p4 = vec4(endCenter[0] - Math.sin(-1*this.batAngle) * this.radius * 3,
		endCenter[1] - Math.cos(-1*this.batAngle) * this.radius * 3,
		endCenter[2] + this.height/2,1);
	this.points = this.points.concat([p1,p4,p2]);
	this.points = this.points.concat([p1,p3,p4]);
	var t1 = subtract(p2, p1);
	var t2 = subtract(p3, p1);
	var normal = normalize(cross(t2, t1));
	normal = vec4(normal);
	this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);
};

function Ball(center, radius, timesToSubdivide) {
  this.timesToSubdivide = timesToSubdivide;
  this.normalsArray = [];
  this.pointsArray = [];
  this.index = 0;
  this.radius= radius;
  this.center = center;
}

Ball.prototype.calculateShape = function () {
  this.tetrahedron(va, vb, vc, vd, this.timesToSubdivide);
  for (var i=0; i<this.pointsArray.length; i++) {
    this.pointsArray[i] = add(this.pointsArray[i], this.center);
  }
  for (var i=0; i<this.normalsArray.length; i++) {
    this.normalsArray[i] = normalize(add(this.normalsArray[i], this.center), true);
  }
}

Ball.prototype.triangle = function(a, b, c) {

     var t1 = subtract(b, a);
     var t2 = subtract(c, a);
     var normal = normalize(cross(t1, t2));
     normal = vec4(normal);

     this.normalsArray.push(normal);
     this.normalsArray.push(normal);
     this.normalsArray.push(normal);

     a = scale(ballRadius, a);
     b = scale(ballRadius, b);
     c = scale(ballRadius, c);
     a[3] = 1;
     b[3] = 1;
     c[3] = 1;

     this.pointsArray.push(a);
     this.pointsArray.push(b);
     this.pointsArray.push(c);

     this.index += 3;
}

Ball.prototype.divideTriangle = function(a,b,c,count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        this.divideTriangle( a, ab, ac, count - 1 );
        this.divideTriangle( ab, b, bc, count - 1 );
        this.divideTriangle( bc, c, ac, count - 1 );
        this.divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        this.triangle( a, b, c );
    }
}

Ball.prototype.tetrahedron = function (a, b, c, d, n) {
    this.divideTriangle(a, b, c, n);
    this.divideTriangle(d, c, b, n);
    this.divideTriangle(a, d, b, n);
    this.divideTriangle(a, c, d, n);
}
