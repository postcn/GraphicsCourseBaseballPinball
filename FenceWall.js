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

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];    
    
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];

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

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]); 
     colorsArray.push(vertexColors[a]); 
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]); 
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[1]); 

     pointsArray.push(vertices[c]); 
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[2]); 
   
     pointsArray.push(vertices[a]); 
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[0]); 

     pointsArray.push(vertices[c]); 
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[2]); 

     pointsArray.push(vertices[d]); 
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[3]);    
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
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
    
    colorCube();
    f = new Field(vec3(0,0,0), .75, .73, .70, .07);
    f.calculateShape();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(f.colors), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(f.points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
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
    

 document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
 document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
 document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
 document.getElementById("ButtonT").onclick = function(){flag = !flag;};
                       
    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(flag) theta[axis] += 2.0;
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