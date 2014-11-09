var GRAY = new vec4(125/255,125/255,125/255);
var GREEN = new vec4(.2, 1, .2, 1);
var SAND = new vec4(237/255, 201/255, 175/255, 1);
var f;

var canvas;
var gl;

var numVertices  = 36;

var texSize = 256;
var numChecks = 8;

var program;

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

var theta = [-45, 180, 0];

var thetaLoc;

function configureTexture() {
    texture1 = gl.createTexture();       
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

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
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    f = new Field(vec3(0,0,0), .75, .73, .70, .07);
    f.calculateShape();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(f.colors), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(f.points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(f.textures), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    configureTexture();
    
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);
            
    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1);

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays( gl.TRIANGLES, 0, f.points.length );
    requestAnimFrame(render);
}

/*
Add the code for the field object and associated information
*/

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
};

function Field(centerPoint, centerFieldWall, rightFieldWall, leftFieldWall, height) {
    this.centerPoint = centerPoint;
    this.xleft = Math.cos(Math.PI/4)*leftFieldWall;
    this.xright = Math.cos(Math.PI/4)*rightFieldWall;
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

function Bat(knobCenter, radius, height, batLength, divisions) {
    this.knobCenter = knobCenter;
    this.radius = radius;
    this.height = height;
                this.batLength = batLength;
    this.divisions = divisions;
    this.normals = [];
    this.points = [];
}

Bat.prototype.calculateShape = function() {
    elipse1 = ellipse(this.knobCenter, 2*this.radius, this.radius, 0, 2 * Math.PI, 2 * Math.PI/this.divisions);
                var endCenter =[this.knobCenter[0]+this.batLength, this.knobCenter[1], this.knobCenter[2]];
                elipse2 = ellipse(endCenter, 3*this.radius, 2*this.radius, 0, 2*Math.PI, 2 * Math.PI/this.divisions);
    this.getTopAndBottomCirclePanels(this.knobCenter, elipse1);
                this.getTopAndBottomBarrelPanels(this.knobCenter, endCenter);
                this.getTopAndBottomCirclePanels(endCenter, elipse2);
                
    this.getSideCirclePanel(this.knobCenter, elipse1);
                this.getSideBarrelPanel(this.knobCenter, endCenter);
                this.getSideCirclePanel(endCenter, elipse2);
}

Bat.prototype.getTopAndBottomCirclePanels = function(centerPoint, circlePoints) {

    for (var i=0; i<circlePoints.length - 1; i++) {
        p1 = vec4(centerPoint[0], centerPoint[1], centerPoint[2]+this.height/2,1);
        p2 = vec4(circlePoints[i][0], circlePoints[i][1], centerPoint[2]+this.height/2,1);
        p3 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], centerPoint[2]+this.height/2,1);
        this.points = this.points.concat([p1,p3,p2]);
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal]);

        p1 = vec4(centerPoint[0], centerPoint[1], centerPoint[2]-this.height/2,1);
        p2 = vec4(circlePoints[i][0], circlePoints[i][1], centerPoint[2]-this.height/2,1);
        p3 = vec4(circlePoints[i+1][0], circlePoints[i+1][1], centerPoint[2]-this.height/2,1);
        this.points = this.points.concat([p1,p3,p2]);
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(cross(t1, t2));
        normal = vec4(normal);
        this.normals = this.normals.concat([normal,normal,normal]);
    }
                
    p1 = vec4(centerPoint[0], centerPoint[1], centerPoint[2]+this.height/2,1);
    p2 = vec4(circlePoints[i][0], circlePoints[i][1], centerPoint[2]+this.height/2,1);
    p3 = vec4(circlePoints[0][0], circlePoints[0][1], centerPoint[2]+this.height/2,1);
    this.points = this.points.concat([p1,p3,p2]);
    var t1 = subtract(p2, p1);
    var t2 = subtract(p3, p1);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal]);

    p1 = vec4(centerPoint[0], centerPoint[1], centerPoint[2]-this.height/2,1);
    p2 = vec4(circlePoints[i][0], circlePoints[i][1], centerPoint[2]-this.height/2,1);
    p3 = vec4(circlePoints[0][0], circlePoints[0][1], centerPoint[2]-this.height/2,1);
    this.points = this.points.concat([p1,p3,p2]);
    var t1 = subtract(p1,p2);
    var t2 = subtract(p1,p3);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal]);
}

Bat.prototype.getTopAndBottomBarrelPanels = function(knob, end) {
    p1 = vec4(knob[0], knob[1]+this.radius/2, knob[2]+this.height/2,1);
    p2 = vec4(end[0], end[1]+3*this.radius, end[2]+this.height/2,1);
    p3 = vec4(end[0], end[1], end[2]+this.height/2,1);
    this.points = this.points.concat([p1,p3,p2]);
    var t1 = subtract(p1,p2);
    var t2 = subtract(p1,p3);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal]);

    p1 = vec4(knob[0], knob[1]+this.radius/2, knob[2]-this.height/2,1);
    p2 = vec4(end[0], end[1]+3*this.radius, end[2]-this.height/2,1);
    p3 = vec4(end[0], end[1], end[2]-this.height/2,1);
    this.points = this.points.concat([p1,p3,p2]);
    var t1 = subtract(p1,p2);
    var t2 = subtract(p1,p3);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal]);
    
    p1 = vec4(end[0], end[1], end[2]+this.height/2,1);
    p2 = vec4(knob[0], knob[1]-this.radius/2, knob[2]+this.height/2,1);
    p3 = vec4(knob[0], knob[1]+this.radius/2, knob[2]+this.height/2,1);
    this.points = this.points.concat([p1,p3,p2]);
    var t1 = subtract(p1,p2);
    var t2 = subtract(p1,p3);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal]);

    p1 = vec4(end[0], end[1], end[2]-this.height/2,1);
    p2 = vec4(knob[0], knob[1]-this.radius/2, knob[2]-this.height/2,1);
    p3 = vec4(knob[0], knob[1]+this.radius/2, knob[2]-this.height/2,1);
    this.points = this.points.concat([p1,p3,p2]);
    var t1 = subtract(p1,p2);
    var t2 = subtract(p1,p3);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal]);
    
    p1 = vec4(knob[0], knob[1]-this.radius/2, knob[2]+this.height/2,1);
    p2 = vec4(end[0], end[1], end[2]+this.height/2,1);
    p3 = vec4(end[0], end[1]-3*this.radius, end[2]+this.height/2,1);
    this.points = this.points.concat([p1,p3,p2]);
    var t1 = subtract(p1,p2);
    var t2 = subtract(p1,p3);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal]);

    p1 = vec4(knob[0], knob[1]-this.radius/2, knob[2]-this.height/2,1);
    p2 = vec4(end[0], end[1], end[2]-this.height/2,1);
    p3 = vec4(end[0], end[1]-3*this.radius, end[2]-this.height/2,1);
    this.points = this.points.concat([p1,p3,p2]);
    var t1 = subtract(p1,p2);
    var t2 = subtract(p1,p3);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal]);
}

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
}

Bat.prototype.getSideBarrelPanel = function(center, endCenter) {
    p1 = vec4(center[0], center[1]+this.radius/2, center[2]+this.height/2, 1);
    p2 = vec4(endCenter[0], endCenter[1]+3*this.radius, endCenter[2]+this.height/2, 1);
    p3 = vec4(center[0], center[1]+this.radius/2, center[2]-this.height/2, 1);
    p4 = vec4(endCenter[0], endCenter[1]+3*this.radius, endCenter[2]-this.height/2, 1);
    this.points = this.points.concat([p1,p4,p2]);
    this.points = this.points.concat([p1,p3,p4]);
    var t1 = subtract(p2, p1);
    var t2 = subtract(p3, p1);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);
    
    p3 = vec4(center[0], center[1]-this.radius/2, center[2]+this.height/2, 1);
    p4 = vec4(endCenter[0], endCenter[1]-3*this.radius, endCenter[2]+this.height/2, 1);
    p1 = vec4(center[0], center[1]-this.radius/2, center[2]-this.height/2, 1);
    p2 = vec4(endCenter[0], endCenter[1]-3*this.radius, endCenter[2]-this.height/2, 1);
    this.points = this.points.concat([p1,p4,p2]);
    this.points = this.points.concat([p1,p3,p4]);
    var t1 = subtract(p2, p1);
    var t2 = subtract(p3, p1);
    var normal = normalize(cross(t1, t2));
    normal = vec4(normal);
    this.normals = this.normals.concat([normal,normal,normal,normal,normal,normal]);
}
