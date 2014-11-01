
var gl;
var vertices;
var colorLoc;
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var LIGHTRED = vec4(1, 0.5, 0.5, 1);
var BLACK = vec4(0.0, 0.0, 0.0, 1.0);
var SAND = vec4(237/255, 201/255, 175/255, 1.0);
var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var LIGHTBLUE = vec4(.5, .5, 1, 1);
var GREEN = vec4(0, 1, 0, 1);
var YELLOW = vec4(1, 1, 0, 1);
var PURPLE = vec4(1, 0, 1, 1);
var WHITE = vec4(1, 1, 1, 1);
var SQUARE_SIZE = 2/15;
var canvasXOffset;
var canvasYOffset;

var dice = [];
var turn;

var selectedPiece = null;

var board = new Board();

function Piece(color) {
    this.center = null;
    this.radius = SQUARE_SIZE/2;
    this.color = color;
    this.boardLoc = null;
    this.lastPosition = null;
}

Piece.prototype.getRenderPoints = function() {
    return ellipse(this.center, this.radius, this.radius, 0, Math.PI * 2, .1);
};

Piece.prototype.clickedWithin = function(point) {
    //determine how to tell if we clicked within the circle at coord vec2(x,y);
    return Math.pow(point[0]- this.center[0], 2) + Math.pow(point[1] - this.center[1], 2) < Math.pow(this.radius,2);
}

Piece.prototype.moveRelativeToBoard = function () {
    //determine closest point on the board.
    var location = null;
    var d = Number.MAX_VALUE;
    for (var i=0; i<board.locationCenterPoints.length; i++) {
        if (i==24) {
            //never let someone place a tile on the middle bar.
            continue;
        }
        var point = board.locationCenterPoints[i][0];
        if (this.color == RED && i==25) {
            point = board.locationCenterPoints[i][1];
        }
        if (distance(this.center, point) < d) {
            d = distance(this.center, point);
            location = i;
        }
    }
    if (!board.validMove(this, location)) {
        this.center = this.lastPosition;
        return;
    }
    //remove it from its last location.
    var index = board.piecesAtLocation[this.boardLoc].indexOf(this);
    board.piecesAtLocation[this.boardLoc].splice(index, 1);
    board.cascadePieces(this.boardLoc);
    //set its new location.
    if (board.piecesAtLocation[location].length == 1 && board.piecesAtLocation[location][0].color != this.color && location != 25) {
        var captured = board.piecesAtLocation[location][0];
        board.piecesAtLocation[location].splice(0, 1);
        captured.boardLoc = 24;
        captured.center = board.locationCenterPoints[24][board.piecesAtLocation[24].length];
        board.piecesAtLocation[24].push(captured);
        captured.lastPosition = captured.center;
    }
    board.piecesAtLocation[location].push(this);
    this.boardLoc = location;
    if (location != 25) {
        this.center = board.locationCenterPoints[location][board.piecesAtLocation[location].length-1];
    }
    else {
        this.center = this.color == RED ? board.locationCenterPoints[location][1] : board.locationCenterPoints[location][0];
    }
    this.lastPosition = this.center;
}

function distance(point1, point2) {
    return Math.sqrt(Math.pow(point1[0] - point2[0], 2)+Math.pow(point1[1]-point2[1], 2));
}

function Board() {
    this.pieces = [];
    this.piecesAtLocation = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[], []];
    this.locationCenterPoints = [[vec2(1-1.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(1-1.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(1-1.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(1-1.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(1-1.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(1-2.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(1-2.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(1-2.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(1-2.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(1-2.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(1-3.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(1-3.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(1-3.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(1-3.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(1-3.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(1-4.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(1-4.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(1-4.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(1-4.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(1-4.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(1-5.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(1-5.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(1-5.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(1-5.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(1-5.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(1-6.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(1-6.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(1-6.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(1-6.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(1-6.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(-1+6.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(-1+6.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(-1+6.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(-1+6.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(-1+6.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(-1+5.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(-1+5.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(-1+5.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(-1+5.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(-1+5.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(-1+4.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(-1+4.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(-1+4.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(-1+4.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(-1+4.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(-1+3.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(-1+3.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(-1+3.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(-1+3.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(-1+3.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(-1+2.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(-1+2.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(-1+2.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(-1+2.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(-1+2.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(-1+1.5*SQUARE_SIZE, -1+1.5*SQUARE_SIZE), vec2(-1+1.5*SQUARE_SIZE, -1+2.5*SQUARE_SIZE), vec2(-1+1.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE),vec2(-1+1.5*SQUARE_SIZE, -1+4.5*SQUARE_SIZE), vec2(-1+1.5*SQUARE_SIZE, -1+5.5*SQUARE_SIZE)],
                                    [vec2(-1+1.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(-1+1.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(-1+1.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(-1+1.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(-1+1.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(-1+2.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(-1+2.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(-1+2.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(-1+2.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(-1+2.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(-1+3.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(-1+3.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(-1+3.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(-1+3.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(-1+3.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(-1+4.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(-1+4.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(-1+4.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(-1+4.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(-1+4.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(-1+5.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(-1+5.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(-1+5.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(-1+5.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(-1+5.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(-1+6.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(-1+6.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(-1+6.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(-1+6.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(-1+6.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(1-6.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(1-6.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(1-6.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(1-6.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(1-6.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(1-5.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(1-5.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(1-5.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(1-5.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(1-5.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(1-4.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(1-4.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(1-4.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(1-4.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(1-4.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(1-3.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(1-3.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(1-3.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(1-3.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(1-3.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(1-2.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(1-2.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(1-2.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(1-2.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(1-2.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(1-1.5*SQUARE_SIZE, 1-1.5*SQUARE_SIZE), vec2(1-1.5*SQUARE_SIZE, 1-2.5*SQUARE_SIZE), vec2(1-1.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE),vec2(1-1.5*SQUARE_SIZE, 1-4.5*SQUARE_SIZE), vec2(1-1.5*SQUARE_SIZE, 1-5.5*SQUARE_SIZE)],
                                    [vec2(0, 1-1.5*SQUARE_SIZE),vec2(0, 1-2.5*SQUARE_SIZE),vec2(0, 1-3.5*SQUARE_SIZE),vec2(0, 1-4.5*SQUARE_SIZE),vec2(0, 1-5.5*SQUARE_SIZE),vec2(0, 1-6.5*SQUARE_SIZE),vec2(0, 1-7.5*SQUARE_SIZE),vec2(0, 1-8.5*SQUARE_SIZE),vec2(0, 1-9.5*SQUARE_SIZE),vec2(0, 1-10.5*SQUARE_SIZE),vec2(0, 1-11.5*SQUARE_SIZE),vec2(0, 1-12.5*SQUARE_SIZE),vec2(0, 1-13.5*SQUARE_SIZE)],
                                    [vec2(1-.5*SQUARE_SIZE, -1+3.5*SQUARE_SIZE), vec2(1-.5*SQUARE_SIZE, 1-3.5*SQUARE_SIZE)]]
    this.backgroundPoints = [vec2(-1, 1), vec2(1,1), vec2(1, -1), vec2(-1,-1)];
    this.backgroundColor = BLACK;
    this.innerBackgroundPoints = [vec2(-1+SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+SQUARE_SIZE, -1 + SQUARE_SIZE)]
    this.innerBackgroundColor = SAND;
    this.crossBarPoints = [vec2(-1*SQUARE_SIZE/2, 1-SQUARE_SIZE), vec2(SQUARE_SIZE/2, 1-SQUARE_SIZE), vec2(SQUARE_SIZE/2, -1+SQUARE_SIZE), vec2(-1*SQUARE_SIZE/2, -1+SQUARE_SIZE)]
    this.crossBarColor = BLACK;
    this.evenTriangles = [vec2(1-SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-2*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-1.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(1-3*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-4*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-3.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(1-5*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-6*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-5.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(-1+2*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+3*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+2.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(-1+4*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+5*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+4.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(-1+6*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+7*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+6.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(1-2*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-3*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-2.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(1-4*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-5*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-4.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(1-6*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-7*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-6.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(-1+SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+2*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+1.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(-1+3*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+4*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+3.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(-1+5*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+6*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+5.5*SQUARE_SIZE, -1+6*SQUARE_SIZE)];
    this.evenTrianglesColor = LIGHTRED;
    this.oddTriangles = [vec2(1-2*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-3*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-2.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(1-4*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-5*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-4.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(1-6*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-7*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(1-6.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(-1+SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+2*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+1.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(-1+3*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+4*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+3.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(-1+5*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+6*SQUARE_SIZE, 1-SQUARE_SIZE), vec2(-1+5.5*SQUARE_SIZE, 1-6*SQUARE_SIZE),
                            vec2(1-SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-2*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-1.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(1-3*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-4*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-3.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(1-5*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-6*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(1-5.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(-1+2*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+3*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+2.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(-1+4*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+5*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+4.5*SQUARE_SIZE, -1+6*SQUARE_SIZE),
                            vec2(-1+6*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+7*SQUARE_SIZE, -1+SQUARE_SIZE), vec2(-1+6.5*SQUARE_SIZE, -1+6*SQUARE_SIZE)];
    this.oddTrianglesColor = LIGHTBLUE;
}

Board.prototype.addPiece = function(piece, triangleLocation) {
    this.pieces.push(piece);
    this.piecesAtLocation[triangleLocation].push(piece);
    piece.center = this.locationCenterPoints[triangleLocation][this.piecesAtLocation[triangleLocation].length-1];
    piece.boardLoc = triangleLocation;
    piece.lastPosition = piece.center;
}

Board.prototype.getRenderLength = function() {
    tot = 0;
    tot += this.backgroundPoints.length;
    tot += this.innerBackgroundPoints.length;
    tot += this.crossBarColor.length;
    tot += this.evenTriangles.length;
    tot += this.oddTriangles.length;
    for (var i = this.pieces.length - 1; i >= 0; i--) {
        var p = this.pieces[i];
        tot += p.getRenderPoints().length;
    };
    return tot*8;
}

Board.prototype.getRenderPoints = function() {
    var points = [];
    points = points.concat(this.backgroundPoints);
    points = points.concat(this.innerBackgroundPoints);
    points = points.concat(this.crossBarPoints);
    points = points.concat(this.evenTriangles);
    points = points.concat(this.oddTriangles);
    for (var i = this.pieces.length - 1; i >= 0; i--) {
        points = points.concat(this.pieces[i].getRenderPoints());
    };
    return points;
}

Board.prototype.determineClickedPiece = function(point) {
    for (var i = this.pieces.length - 1; i >= 0; i--) {
        if (this.pieces[i].clickedWithin(point)) {
            return this.pieces[i];
        }
    };
    return null;
}

Board.prototype.cascadePieces = function(index) {
    for (var i = 0; i<this.piecesAtLocation[index].length; i++) {
        var piece = this.piecesAtLocation[index][i];
        piece.center = this.locationCenterPoints[index][i];
    }
}

Board.prototype.validMove = function(piece, location) {
    //move piece to location. is it valid?
    //can't be more than five in a stack
    //can't be a row with different color (unless there is only one)

    //convert location if it is special
    if (piece.color != turn || piece.boardLoc == 25 || location == 24) {
        return false;
    }
    if (!((this.piecesAtLocation[location].length < 5 || location ==25) && (this.piecesAtLocation[location].length == 0 || this.piecesAtLocation[location][0].color == piece.color || location ==25 || (this.piecesAtLocation[location][0].color != piece.color && this.piecesAtLocation[location].length == 1)))) {
        return false;
    }
    if (piece.color == RED && (location < piece.boardLoc && piece.boardLoc != 24)) {
        return false;
    }
    else if (piece.color == BLUE && (location > piece.boardLoc && location != 25)) {
        return false;
    }
    //are they making a valid move based on the dice?
    var dif = Math.abs((piece.boardLoc == 24 && piece.color == RED ? -1 : piece.boardLoc) - (location == 25 && piece.color == BLUE ? -1 : (location == 25 && piece.color == RED ? 24 : location)));
    if (dice.indexOf(dif) < 0) {
        return false;
    }
    else {
        var index = dice.indexOf(dif);
        dice.splice(index, 1);
    }

    return true;
}

Board.prototype.setupInitialBoard = function() {
    var i;
    for (i=0; i< 2; i++) {
        this.addPiece(new Piece(RED), 0);
        this.addPiece(new Piece(BLUE), 23);
    }

    for (i=0; i<5; i++) {
        this.addPiece(new Piece(BLUE), 5);
        this.addPiece(new Piece(RED), 18);
        this.addPiece(new Piece(RED), 11);
        this.addPiece(new Piece(BLUE), 12);
    }

    for (i=0; i<3; i++) {
        this.addPiece(new Piece(RED), 16);
        this.addPiece(new Piece(BLUE), 7);
    }


}

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    canvasXOffset = canvas.offsetLeft;
    canvasYOffset = canvas.offsetTop;

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    board.setupInitialBoard();
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorLoc = gl.getUniformLocation (program, "color");
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(board.getRenderPoints()), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("mousedown", function(event){
        point = vec2(2*(event.clientX-canvasXOffset)/canvas.width-1, 
            2*(canvas.height-event.clientY+canvasYOffset)/canvas.height-1);
        selectedPiece = board.determineClickedPiece(point);
    } );

    canvas.addEventListener("mousemove", function(event){
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer); //bind the vertex buffer.
        point = vec2(2*(event.clientX-canvasXOffset)/canvas.width-1, 
            2*(canvas.height-event.clientY+canvasYOffset)/canvas.height-1);
        if (selectedPiece != null) {
            selectedPiece.center = point;
            old = board.getRenderPoints();
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(board.getRenderPoints()));
        }
    });

    canvas.addEventListener("mouseup", function(event) {
        if (selectedPiece!= null) {
            selectedPiece.moveRelativeToBoard();
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(board.getRenderPoints()));
        }
        selectedPiece = null;
    });

    document.getElementById("roll").onclick = function(){
        if (dice.length != 0) {
            return;
        }
        dice=[Math.ceil(Math.random()*6), Math.ceil(Math.random()*6)];
        document.getElementById("dice1").innerHTML=dice[0];
        document.getElementById("dice2").innerHTML=dice[1];
        turn = turn == RED ? BLUE : RED;
        document.getElementById("turn").innerHTML = turn == RED ? "Red's Turn" : "Blue's Turn";
        
    };

    render();
};


function render() {
    var index = 0;
    gl.uniform4fv(colorLoc, board.backgroundColor);
    gl.drawArrays(gl.TRIANGLE_FAN, index, board.backgroundPoints.length);
    index += board.backgroundPoints.length;
    gl.uniform4fv(colorLoc, board.innerBackgroundColor);
    gl.drawArrays(gl.TRIANGLE_FAN, index, board.innerBackgroundPoints.length);
    index += board.innerBackgroundPoints.length;
    gl.uniform4fv(colorLoc, board.crossBarColor);
    gl.drawArrays(gl.TRIANGLE_FAN, index, board.crossBarPoints.length);
    index += board.crossBarPoints.length;
    gl.uniform4fv(colorLoc, board.evenTrianglesColor);
    gl.drawArrays(gl.TRIANGLES, index, board.evenTriangles.length);
    index += board.evenTriangles.length;
    gl.uniform4fv(colorLoc, board.oddTrianglesColor);
    gl.drawArrays(gl.TRIANGLES, index, board.oddTriangles.length);
    index += board.oddTriangles.length;
    for (var i = board.pieces.length - 1; i >= 0; i--) {
        var piece = board.pieces[i];
        gl.uniform4fv(colorLoc, piece.color);
        var length = piece.getRenderPoints().length;
        gl.drawArrays( gl.TRIANGLE_FAN, index,length);
        index += length;
    };
 
	window.requestAnimFrame (render);
}

function ellipse(center, yRadius, xRadius, startTheta, endTheta, stepTheta) {
    var ellipsePoints = [];
    var currentTheta = startTheta;
    var prevPoint = vec2(xRadius*Math.sin(currentTheta) + center[0], yRadius*Math.cos(currentTheta)+center[1]);
    while (currentTheta < endTheta) {
        currentTheta += stepTheta;
        var nextPoint = vec2(xRadius*Math.sin(currentTheta) + center[0], yRadius*Math.cos(currentTheta)+center[1]);
        ellipsePoints = ellipsePoints.concat([prevPoint, nextPoint]);
        prevPoint = nextPoint;
    }
    return ellipsePoints;
}
