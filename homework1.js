"use strict";

var canvas;
var gl;

var numVertices = 36;

var numChecks = 8;

var texSize = 256;

// Create a checkerboard pattern using floats


var image1 = new Array()
    for (var i =0; i<texSize; i++)  image1[i] = new Array();
    for (var i =0; i<texSize; i++)
        for ( var j = 0; j < texSize; j++)
           image1[i][j] = new Float32Array(4);
    for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
        image1[i][j] = [c, c, c, 1];
    }

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ )
        for ( var j = 0; j < texSize; j++ )
           for(var k =0; k<4; k++)
                image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


var gouraudProgram;
var phongProgram;

var c;

var pointsArray = [];
var colorsArray = [];
var normalsArray = [];
var texCoordsArray = [];

// Control sliders
let scaling;
let translating_x;
let translating_y;
let translating_z;
let near_slider;
let far_slider;
let fov_slider;
let radius_slider;
let theta_slider;
let phi_slider;

let shadingButton;

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // white
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

let isGouraud = true;

function quad(a, b, c, d) {

    let t1 = subtract(vertices[b], vertices[a]);
    let t2 = subtract(vertices[c], vertices[b]);
    let normal = cross(t1, t2);
    normal = vec3(normal);
    normal = normalize(normal);


    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[1]);
    normalsArray.push(normal);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[3]);
    normalsArray.push(normal);
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function updateShadingButton() {
    shadingButton.value = isGouraud ? "Gouraud model(active). Push to switch to Phong one" : 
    "Phong model(active). Push to switch to Gouraud one";
}

var theta = [0.0, 0.0, 0.0];

var thetaLoc;

function configureTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    gouraudProgram = initShaders(gl, "gouraud-vertex-shader", "gouraud-fragment-shader");
    phongProgram = initShaders(gl, "phong-vertex-shader", "phong-fragment-shader");

    colorCube();

    let cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    let vColor = gl.getAttribLocation(gouraudProgram, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    vColor = gl.getAttribLocation(phongProgram, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(gouraudProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    vPosition = gl.getAttribLocation(phongProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //Init a texture
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    var vTexCoord = gl.getAttribLocation( gouraudProgram, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
    var vTexCoord = gl.getAttribLocation( phongProgram, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.uniform4fv(gl.getUniformLocation(gouraudProgram, "vNormal"), flatten(normalsArray));
    gl.uniform4fv(gl.getUniformLocation(phongProgram, "vNormal"), flatten(normalsArray));

    shadingButton = document.getElementById("ButtonG");
    shadingButton.onclick = function () {
        isGouraud = !isGouraud;
        updateShadingButton()
    };
    updateShadingButton();

    //sliders for getting parameters of the model
    scaling = document.getElementById("slide_scaling");
    translating_x = document.getElementById("slide_translating_x");
    translating_y = document.getElementById("slide_translating_y");
    translating_z = document.getElementById("slide_translating_z");
    near_slider = document.getElementById("slide_near");
    far_slider = document.getElementById("slide_far");
    fov_slider = document.getElementById("slide_fov");

    radius_slider = document.getElementById("slide_radius");
    theta_slider = document.getElementById("slide_theta");
    phi_slider = document.getElementById("slide_phi");

    render();
};


var render = function () {
    
    function renderScene(drawX, drawY, drawWidth, drawHeight, projectionMatrix) {
      //Let's make a scissor test to prepare the window to work
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(drawX, drawY, drawWidth, drawHeight);
      gl.viewport(drawX, drawY, drawWidth, drawHeight);
            
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
      let modelViewMatrix = lookAt(eye, at , up);
      modelViewMatrix = mult(modelViewMatrix, translate(translating_x.value, translating_y.value, translating_z.value));
      modelViewMatrix = mult(modelViewMatrix, scalem(scaling.value, scaling.value, scaling.value));

      

      gl.uniformMatrix4fv(gl.getUniformLocation(currentProgram, "modelViewMatrix"), false, flatten(modelViewMatrix));
      gl.uniformMatrix4fv(gl.getUniformLocation(currentProgram, "projectionMatrix"), false, flatten(projectionMatrix));
  
      gl.uniform4fv(gl.getUniformLocation(currentProgram, "ambientProduct"), flatten(ambientProduct));
      gl.uniform4fv(gl.getUniformLocation(currentProgram, "diffuseProduct"), flatten(diffuseProduct));
      gl.uniform4fv(gl.getUniformLocation(currentProgram, "specularProduct"), flatten(specularProduct));
      gl.uniform4fv(gl.getUniformLocation(currentProgram, "lightPosition"), flatten(lightPosition));
      gl.uniform1f(gl.getUniformLocation(currentProgram, "shininess"), materialShininess);
      
      configureTexture(image2);
      thetaLoc = gl.getUniformLocation(currentProgram, "theta");
      gl.uniform3fv(thetaLoc, theta);

      gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    }

    

    //Introduce all needed variables
    var width = gl.canvas.width;
    var height = gl.canvas.height;
    var displayWidth = gl.canvas.clientWidth;
    var displayHeight = gl.canvas.clientHeight;
    
    let fovy = fov_slider.value;
    let near = near_slider.value;
    let far = far_slider.value;
    
    let radius = radius_slider.value;
    let thetha = theta_slider.value;    
    let phi = phi_slider.value;
    //const eye = vec3(-3.0, 3.0, 3.0);
    let eye = vec3(radius*Math.sin(thetha*Math.PI/360)*Math.cos(phi*Math.PI/360), radius*Math.sin(thetha*Math.PI/360)*Math.sin(phi*Math.PI/360), radius*Math.cos(thetha*Math.PI/360));

    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);
    
    //define data for light and material
    let lightPosition = vec4(2.0, 0.0, 0.0, 1.0);
    let lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
    let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
    let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

    let materialAmbient = vec4(1.0, 0.1, 0.5, 1.0);
    let materialDiffuse = vec4(0.0, 0.3, 0.4, 1.0);
    let materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
    let materialShininess = 100.0;

    let ambientProduct = mult(lightAmbient, materialAmbient);
    let diffuseProduct = mult(lightDiffuse, materialDiffuse);
    let specularProduct = mult(lightSpecular, materialSpecular);

    let currentProgram = isGouraud ? gouraudProgram : phongProgram;
      gl.useProgram(currentProgram);

    // draw left
    {
      let dispWidth = displayWidth / 2;
      let dispHeight = displayHeight;
      let aspect = dispWidth / dispHeight;
      let projectionMatrix = perspective(fovy, aspect, near, far);
      gl.clearColor(0.8, 0.8, 0.8, 1);
      renderScene(0, 0, width / 2, height, projectionMatrix);
    }

    // draw right
    {
      let dispWidth = displayWidth / 2;
      let dispHeight = displayHeight;
      let aspect = dispWidth / dispHeight;
      let top = 1;
      let bottom = -top;
      let right = top * aspect;
      let left = -right;
      let projectionMatrix = ortho(left, right, bottom, top,  near, far);
      gl.clearColor(0.2, 0.2, 0.2, 1);
      renderScene(width / 2, 0, width / 2, height, projectionMatrix);
    }

    requestAnimFrame(render);
    

};
