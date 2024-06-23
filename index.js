/*
    Projeto Final de MAC0420/MAC5744 - Voxel Sandbox

    Nome: Bruno Lourenço da Cunha
    NUSP: 10372978
 */

"use strict";

window.onload = main;

const BACKGROUND_COLOR = [0, 0, 1, 1];
const STEP_DELTA_TIME = 0.1;
const PLAYER_SPEED = 300;
const PLAYER_HEIGHT = 75;
const PLAYER_JUMP_VELOCITY = 250;
const WORLD_SIZE = 20;
const WORLD_HEIGHT = 10;
const RAY_SIZE = 100;
const G = 9.8 * 50;
const HALF_CUBE_SIZE = 25;
let SHADOW_MAP_SIZE = 1024;
const FOVY = 60;
const ASPECT_RATIO = 4 / 3;
const NEAR = 0.1;
const FAR = 10000;
const SHADOW_DELTA = 0.001;
const SHADOW_TEXTURE_UNIT = 1;

var gCtx;
var gCanvas;
var gShader = {};
var gShaderShadow = {};
var gmProjection;
var gInterface = {};
var gPlaying = true;
var gKeyCode = {
  I: 73,
  K: 75,
  J: 74,
  L: 76,
  T: 84,
  X: 88,
  W: 87,
  A: 65,
  D: 68,
  Z: 90,
  C: 67,
  S: 83,
  ESC: 27,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  Space: 32,
};

var gVertexShaderSrc;
var gFragmentShaderSrc;
var gVertexShaderShadowSrc;
var gFragmentShaderShadowSrc;

var gObjects = [];
var gLastT = Date.now();

var gDefaultMaterial = new Material(Color.White, Color.DarkGrey, 10000);
var gRedMaterial = new Material(Color.Red, Color.DarkGrey, 500);
var gGreenMaterial = new Material(Color.Green, Color.DarkGrey, 1000);
var gBlueMaterial = new Material(Color.Blue, Color.DarkGrey, 100);
var gYellowMaterial = new Material(Color.Yellow, Color.DarkGrey, 1000);

var gBlockType = 0;

const gChao = new Cube(vec3(0, 0, -10), vec3(0, 0, 0), vec3(1000, 1000, 20), vec3(0, 0, 0), vec3(0, 0, 0));
const gBola = new Cube(vec3(0, 0, 90), vec3(0, 0, 0), vec3(30, 30, 30), vec3(0, 0, 0), vec3(0, 0, 0));

const gSphereA = new Sphere(vec3(50, -50, 20), vec3(25, 90, 90), vec3(20, 20, 50), vec3(20, 0, 0), vec3(0, 0, 0), 2);
const gSphereB = new Sphere(vec3(-100, -100, 30), vec3(0, 0, 0), vec3(30, 30, 30), vec3(0, 20, 0), vec3(0, 0, 0), 4);

const gCubeAim = new Cube(vec3(0, 0, 0), vec3(0, 0, 0), vec3(0.5, 0.5, 0.5), vec3(0, 0, 0), vec3(0, 0, 0));
const gCubeB = new Cube(vec3(-50, -50, 50), vec3(0, 0, 0), vec3(50, 50, 50), vec3(0, 0, 0), vec3(0, 0, 0));

const gCubeVertexa = new Cube(vec3(0, 0, 0), vec3(0, 0, 0), vec3(12, 12, 12), vec3(0, 0, 0), vec3(0, 0, 0));
const gCubeVertexb = new Cube(vec3(0, 0, 0), vec3(0, 0, 0), vec3(12, 12, 12), vec3(0, 0, 0), vec3(0, 0, 0));
const gCubeVertexc = new Cube(vec3(0, 0, 0), vec3(0, 0, 0), vec3(12, 12, 12), vec3(0, 0, 0), vec3(0, 0, 0));
const gCubeVertexd = new Cube(vec3(0, 0, 0), vec3(0, 0, 0), vec3(12, 12, 12), vec3(0, 0, 0), vec3(0, 0, 0));

const gRedCube = new Cube(vec3(0, 0, 0), vec3(0, 90, 90), vec3(5, 2, 400), vec3(0, 0, -360 / 60), vec3(0, 0, 0));
const gRedCube2 = new Cube(vec3(0, 0, 0), vec3(0, 90, 90), vec3(10, 5, 400), vec3(0, 0, -0.1), vec3(0, 0, 0));

const gSphereYellow = new Sphere(
  vec3(-100, 0, 20),
  vec3(25, 90, 90),
  vec3(20, 20, 5),
  vec3(20, 0, 0),
  vec3(-0.1, -0.1, 0),
  2
);

const gLight = new Light(vec4(50, 50, 50, 0), Color.White, Color.White, Color.DarkGrey);
const gCamera = new Camera(
  vec3(-50, -50, PLAYER_HEIGHT + HALF_CUBE_SIZE),
  vec3(-50, -49, PLAYER_HEIGHT + HALF_CUBE_SIZE)
);

var gPlayerVerticalVelocity = 0;
var gPlayerOnGround = false;
var gPlayerJumping = false;

var gWorld;

var gMouse = { sensibility: 0.1 };
var gTextureConfig = {
  diffuseTextureUnitIndex: 0,
  diffuseTextureIndex: 0,
  TEXTURE_BUFFER_SIZE: 1024,
  TEXTURE_SIZE: 32,
};

var shadowBuffPos = [];

/**
 * Ponto de entrada do codigo
 *
 * Atribui a variável de acesso ao context do canvas "webgl2"
 *
 * Realiza chamadas aos métodos start (inicialização do mundo) e render (primeira renderização)
 */
function main() {
  gCanvas = document.getElementById("glcanvas");
  gCtx = gCanvas.getContext("webgl2");
  if (!gCtx) alert("WebgCtx 2.0 isn't available");
  gShader.program = makeProgram(gCtx, gVertexShaderSrc, gFragmentShaderSrc);
  gCtx.useProgram(gShader.program);

  SHADOW_MAP_SIZE = gCanvas.width;

  gCtx.clearColor(BACKGROUND_COLOR[0], BACKGROUND_COLOR[1], BACKGROUND_COLOR[2], BACKGROUND_COLOR[3]);
  gCtx.enable(gCtx.DEPTH_TEST);
  gCtx.viewport(0, 0, gCanvas.width, gCanvas.height);

  start();
  render();
}

/**
 * Inicialização do mundo
 *
 * Atribui interface, cria objetos e realiza alocação na lista global "gObjects"
 */
function start() {
  console.log(`Unidades de textura disponíveis na GPU: ${gCtx.MAX_COMBINED_TEXTURE_IMAGE_UNITS}`);
  gCubeB.setMaterial(Material.defaultMaterial());

  gCubeVertexa.setMaterial(Material.red());
  gCubeVertexb.setMaterial(Material.green());
  gCubeVertexc.setMaterial(Material.blue());
  gCubeVertexd.setMaterial(Material.yellow());

  gObjects.push(gCubeB, gCubeVertexa, gCubeVertexb, gCubeVertexc, gCubeVertexd);

  buildAim();
  buildWorld();
  buildShaders();
  initializeInterface();
}

function buildAim() {
  gCubeAim.setMaterial(Material.defaultMaterial());
  gCubeAim.pos = gCamera.pos;
  let forward = gCamera.forward;
  const newPosOffset = mult(50, vec3(forward[0], forward[1], forward[2]));
  gCubeAim.vertexes = gCubeAim.vertexes.map((vertex) => add(vertex, newPosOffset));
  gObjects.push(gCubeAim);
}

function buildWorld() {
  gWorld = new World(WORLD_SIZE, WORLD_HEIGHT, gTextureConfig, gCtx);
  const halfWL = Math.ceil(WORLD_HEIGHT / 2);

  gWorld.buildGround(halfWL);
  gWorld.build();

  // worldVoxelMatrix[5][5][5] = 1;
  // worldVoxelMatrix[5][5][6] = 1;
  // worldVoxelMatrix[6][5][6] = 0;
}

/**
 * Define as referências dos botões HTML no objeto gInterface
 *
 * Define callback do teclado e do botão passo
 */
function initializeInterface() {
  gInterface.jogarPausar = document.getElementById("bRun");
  gInterface.passo = document.getElementById("bStep");

  gInterface.jogarPausar.onclick = playOrPause;

  window.onkeydown = (e) => handleKeyboardEvent(e, true);
  window.onkeyup = (e) => handleKeyboardEvent(e, false);

  window.onmousemove = (e) => handleMouseMovementEvent(e);
  window.onmousedown = (e) => handleMouseDownEvent(e);

  gInterface.passo.onclick = () => update(true, STEP_DELTA_TIME);

  gCanvas.addEventListener("click", async () => {
    await gCanvas.requestPointerLock({
      unadjustedMovement: true,
    });
  });
}

function handleMouseMovementEvent(e) {
  const movementX = e.movementX;
  const movementY = e.movementY;

  if (movementY) {
    const minY = Math.max(-89.9, gCamera.theta[1] - movementY * gMouse.sensibility);
    const minMaxY = Math.min(89.9, minY);

    gCamera.theta[1] = minMaxY;
  }

  if (movementX) {
    gCamera.theta = add(gCamera.theta, vec3(-movementX * gMouse.sensibility, 0, 0));
  }

  gCubeAim.theta = vec3(gCamera.theta[1], 0, gCamera.theta[0]);
}

function handleMouseDownEvent(e) {
  const leftButtonDown = e?.button === 0;
  if (leftButtonDown && gCamera.currentAt) {
    console.log("Botão esquerdo do mouse pressionado");
    const from = gCamera.pos;
    const direction = normalize(gCamera.currentAt);
    const length = 200;

    console.log(`Lançado raio de ${from} com direção ${direction} e tamanho ${length}`);
    const ray = new Ray(from, direction, length);

    const newBlockIndex = gWorld.getNewBlockIndexByRayCollision(ray, gCamera.pos);

    if (newBlockIndex?.length) {
      const [x, y, z] = newBlockIndex;
      gWorld.placeBlock(gBlockType, vec3(x, y, z));
      console.log(`Block can be place at ${x}, ${y}, ${z}`);
    }
  }
}

/**
 * Lida com eventos recebidos do teclado
 *
 * W - Andar para frente
 * S - Andar para trás
 * A - Andar para a esquerda
 * D - Andar para a direita
 */
function handleKeyboardEvent(e, down) {
  const { keyCode } = e;

  if (keyCode == gKeyCode["ESC"]) {
    document.exitPointerLock();
  }

  if (down) {
    if (keyCode == gKeyCode["W"]) {
      gCamera.mDir[1] = 1;

      // console.log("W pressionado; Andando para frente", JSON.stringify({ dir: gCamera.mDir }));
    }

    if (keyCode == gKeyCode["S"]) {
      gCamera.mDir[1] = -1;

      // console.log("S pressionado; Andando para trás", JSON.stringify({ dir: gCamera.mDir }));
    }

    if (keyCode == gKeyCode["A"]) {
      gCamera.mDir[0] = -1;

      // console.log("A pressionado; Andando para esquerda", JSON.stringify({ dir: gCamera.mDir }));
    }

    if (keyCode == gKeyCode["D"]) {
      gCamera.mDir[0] = 1;

      // console.log("D pressionado; Andando para direita", JSON.stringify({ dir: gCamera.mDir }));
    }

    if (keyCode == gKeyCode["Space"]) {
      handlePlayerJump();
      e.preventDefault();
    }
  } else {
    if (keyCode == gKeyCode["W"]) {
      gCamera.mDir[1] = 0;

      // console.log("W solto", JSON.stringify({ dir: gCamera.mDir }));
    }

    if (keyCode == gKeyCode["S"]) {
      gCamera.mDir[1] = 0;

      // console.log("S solto", JSON.stringify({ dir: gCamera.mDir }));
    }

    if (keyCode == gKeyCode["A"]) {
      gCamera.mDir[0] = 0;

      // console.log("A solto", JSON.stringify({ dir: gCamera.mDir }));
    }

    if (keyCode == gKeyCode["D"]) {
      gCamera.mDir[0] = 0;

      // console.log("D solto", JSON.stringify({ dir: gCamera.mDir }));
    }
  }

  if (keyCode == gKeyCode["1"]) {
    gBlockType = 0;
    console.log("Bloco escolhido: Grama");
  }

  if (keyCode == gKeyCode["2"]) {
    gBlockType = 1;
    console.log("Bloco escolhido: Pedra");
  }

  if (keyCode == gKeyCode["3"]) {
    gBlockType = 2;
    console.log("Bloco escolhido: Madeira");
  }

  if (keyCode == gKeyCode["4"]) {
    gBlockType = 3;
    console.log("Bloco escolhido: Grama");
  }
}

/**
 * Lida com a alteração de estado entre jogando e pausado
 *
 * Atualiza os botões HTML e altera a flag gPlaying
 */
function playOrPause() {
  gPlaying = !gPlaying;

  console.log(`Jogo ${gPlaying ? "rodando" : "pausado"}`);

  gInterface.jogarPausar.value = gPlaying ? "Pausar" : "Jogar";
  gInterface.passo.disabled = gPlaying;
  gInterface.passo.value = gPlaying ? " " : "Passo";
}

/**
 * Cria cada VAO gShader.VAO[x] associado ao objeto gObjects[x]
 *
 * Atribui aNormal, aPosition, aColor para cada objeto, além de atribuir também os uniforms de perspectiva,
 * modelView e demais uniforms necessários para o modelo de iluminação de Phong
 */
function buildShaders() {
  gShader.VAO = [];

  makeVAOs();

  gCtx.bindVertexArray(null);

  gShader.uModel = gCtx.getUniformLocation(gShader.program, "uModel");
  gShader.uView = gCtx.getUniformLocation(gShader.program, "uView");
  gShader.uPerspective = gCtx.getUniformLocation(gShader.program, "uPerspective");
  gShader.uInverseTranspose = gCtx.getUniformLocation(gShader.program, "uInverseTranspose");
  gShader.uLightProjectionMatrix = gCtx.getUniformLocation(gShader.program, "uLightProjectionMatrix");
  gShader.uLightViewMatrix = gCtx.getUniformLocation(gShader.program, "uLightViewMatrix");
  gShader.uDelta = gCtx.getUniformLocation(gShader.program, "uDelta");

  gCtx.perspective = perspective(FOVY, ASPECT_RATIO, NEAR, FAR);
  gCtx.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

  gShader.uLightPos = gCtx.getUniformLocation(gShader.program, "uLightPos");
  gCtx.uniform4fv(gShader.uLightPos, gLight.pos);

  const lightProjectionMatrix = perspective(FOVY, ASPECT_RATIO, NEAR, FAR);
  gCtx.uniformMatrix4fv(gShader.uLightProjectionMatrix, false, flatten(lightProjectionMatrix));

  let at = add(gCamera.pos, gCamera.initialAt);
  const lightViewMatrix = lookAt(
    vec3(gLight.pos[0], gLight.pos[1], gLight.pos[2]),
    at,
    vec3(gCamera.up[0], gCamera.up[1], gCamera.up[2])
  );
  gCtx.uniformMatrix4fv(gShader.uLightViewMatrix, false, flatten(lightViewMatrix));

  buildShadowsShaders();

}

function buildShadowsShaders() {
  gShaderShadow.program = makeProgram(gCtx, gVertexShaderShadowSrc, gFragmentShaderShadowSrc);
  gCtx.useProgram(gShaderShadow.program);

  gShaderShadow.VAO = gCtx.createVertexArray();
  gCtx.bindVertexArray(gShaderShadow.VAO);

  // cria buffer contendo todas as posições dos vértices em um mesmo VAO
  shadowBuffPos = gObjects.reduce((buf, object) => buf.concat(object.vertexes), []);
  gShaderShadow.bufVertices = gCtx.createBuffer();
  gCtx.bindBuffer(gCtx.ARRAY_BUFFER, gShaderShadow.bufVertices);
  gCtx.bufferData(gCtx.ARRAY_BUFFER, flatten(shadowBuffPos), gCtx.STATIC_DRAW);

  let positionLoc = gCtx.getAttribLocation(gShaderShadow.program, "aPosition");
  gCtx.vertexAttribPointer(positionLoc, 3, gCtx.FLOAT, false, 0, 0);
  gCtx.enableVertexAttribArray(positionLoc);

  gShaderShadow.uModel = gCtx.getUniformLocation(gShaderShadow.program, "uModel");
  gShaderShadow.uView = gCtx.getUniformLocation(gShaderShadow.program, "uView");
  gShaderShadow.uPerspective = gCtx.getUniformLocation(gShaderShadow.program, "uPerspective");

  const lightViewMatrix = lookAt(
    vec3(gLight.pos[0], gLight.pos[1], gLight.pos[2]),
    add(gCamera.pos, gCamera.initialAt),
    vec3(gCamera.up[0], gCamera.up[1], gCamera.up[2])
  );
  const lightProjectionMatrix = perspective(FOVY, ASPECT_RATIO, NEAR, FAR);

  gCtx.uniformMatrix4fv(gShaderShadow.uView, false, flatten(lightViewMatrix));
  gCtx.uniformMatrix4fv(gShaderShadow.uPerspective, false, flatten(lightProjectionMatrix));

  createFramebuffer();
}

function createFramebuffer() {
  // create shadow texture
  const shadowBuffer = new TextureBuffer(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, SHADOW_TEXTURE_UNIT, gCtx);
  shadowBuffer.buildTexture();
  gShaderShadow.texture = shadowBuffer.getGlTexture();

  // create framebuffer
  gShaderShadow.framebuffer = gCtx.createFramebuffer();
  gCtx.bindFramebuffer(gCtx.FRAMEBUFFER, gShaderShadow.framebuffer);
  gShaderShadow.framebuffer.width = SHADOW_MAP_SIZE;
  gShaderShadow.framebuffer.height = SHADOW_MAP_SIZE;

  gCtx.framebufferTexture2D(gCtx.FRAMEBUFFER, gCtx.COLOR_ATTACHMENT0, gCtx.TEXTURE_2D, gShaderShadow.texture, 0);

  // verify creation status
  var status = gCtx.checkFramebufferStatus(gCtx.FRAMEBUFFER);
  if (status != gCtx.FRAMEBUFFER_COMPLETE) alert("Erro ao criar framebuffer de sombras!");
}

function includeObjectShadow(index) {
  const obj = gObjects[index];
  shadowBuffPos.push(obj.vertexes);
}

function makeVAOs() {
  gShader.VAO = [];
  for (let i = 0; i < gObjects.length; i++) {
    makeVAO(i);
  }
}

function makeVAO(i) {
  gShader.VAO.push(gCtx.createVertexArray());
  gCtx.bindVertexArray(gShader.VAO[i]);

  // buffer das normais
  var bufNormals = gCtx.createBuffer();
  gCtx.bindBuffer(gCtx.ARRAY_BUFFER, bufNormals);
  gCtx.bufferData(gCtx.ARRAY_BUFFER, flatten(gObjects[i].normals), gCtx.STATIC_DRAW);

  var aNormal = gCtx.getAttribLocation(gShader.program, "aNormal");
  gCtx.vertexAttribPointer(aNormal, 3, gCtx.FLOAT, false, 0, 0);
  gCtx.enableVertexAttribArray(aNormal);

  // buffer dos vértices
  var bufVertices = gCtx.createBuffer();
  gCtx.bindBuffer(gCtx.ARRAY_BUFFER, bufVertices);
  gCtx.bufferData(gCtx.ARRAY_BUFFER, flatten(gObjects[i].vertexes), gCtx.STATIC_DRAW);

  var aPosition = gCtx.getAttribLocation(gShader.program, "aPosition");
  gCtx.vertexAttribPointer(aPosition, 3, gCtx.FLOAT, false, 0, 0);
  gCtx.enableVertexAttribArray(aPosition);

  // buffer de cores
  let colors;

  if (gObjects[i].colors) {
    colors = gObjects[i].colors;
  } else if (gObjects[i].material?.areRandomVertexColor) {
    colors = Array.from({ length: gObjects[i].vertexes.length }, () => Color.getRandomColor());
  } else if (gObjects[i].material?.diffuse) {
    const color = gObjects[i].material?.diffuse;
    colors = Array.from({ length: gObjects[i].vertexes.length }, () => color);
  }

  var bufColors = gCtx.createBuffer();
  gCtx.bindBuffer(gCtx.ARRAY_BUFFER, bufColors);
  gCtx.bufferData(gCtx.ARRAY_BUFFER, flatten(colors), gCtx.STATIC_DRAW);

  var aColor = gCtx.getAttribLocation(gShader.program, "aColor");
  gCtx.vertexAttribPointer(aColor, 4, gCtx.FLOAT, false, 0, 0);
  gCtx.enableVertexAttribArray(aColor);

  // fragment shader
  gShader.uAmbient = gCtx.getUniformLocation(gShader.program, "uAmbient");
  gShader.uDiffuse = gCtx.getUniformLocation(gShader.program, "uDiffuse");
  gShader.uSpecular = gCtx.getUniformLocation(gShader.program, "uSpecular");
  gShader.uAlphaSpecular = gCtx.getUniformLocation(gShader.program, "uAlphaSpecular");
  gShader.useVertexColor = gCtx.getUniformLocation(gShader.program, "useVertexColor");
  gShader.useTextureColor = gCtx.getUniformLocation(gShader.program, "useTextureColor");
  gShader.uTextureMap = gCtx.getUniformLocation(gShader.program, "uTextureMap");
  gShader.uShadowTextureMap = gCtx.getUniformLocation(gShader.program, "uShadowTextureMap");

  // textura
  if (!!gObjects[i].texture) {
    var bufTextures = gCtx.createBuffer();
    gCtx.bindBuffer(gCtx.ARRAY_BUFFER, bufTextures);
    gCtx.bufferData(gCtx.ARRAY_BUFFER, flatten(gObjects[i].textureMap), gCtx.STATIC_DRAW);

    var aTextureCoord = gCtx.getAttribLocation(gShader.program, "aTextureCoord");
    gCtx.vertexAttribPointer(aTextureCoord, 2, gCtx.FLOAT, false, 0, 0);
    gCtx.enableVertexAttribArray(aTextureCoord);
  }
}

/**
 * Desenha cada objeto contido no array gObjects.
 *
 * Caso o VAO relacionado a determinada posição do array de objetos não for definido, é realizada uma chamada para recriacao do array
 * Nesta função, é montada a matriz model view de cada objeto e uView, além das matrizes necessárias para o modelo de iluminação de Phong
 *
 * Após o desenho, é feita uma chamada ao método responsável por realizar a atualização dos objetos no próximo quadro
 */
function render() {
  let now = Date.now();
  let deltaTime = (now - gLastT) / 1000;
  gLastT = now;

  gCtx.clear(gCtx.COLOR_BUFFER_BIT | gCtx.DEPTH_BUFFER_BIT);

  renderShadows();

  gCtx.useProgram(gShader.program);
  // gCtx.clearColor(BACKGROUND_COLOR[0], BACKGROUND_COLOR[1], BACKGROUND_COLOR[2], BACKGROUND_COLOR[3]);
  gCtx.enable(gCtx.CULL_FACE);
  gCtx.cullFace(gCtx.BACK);

  let eye = gCamera.pos;
  let up = gCamera.up;

  let roll = rotateY(gCamera.theta[2]);
  let yaw = rotateX(gCamera.theta[1]);
  let pitch = rotateZ(gCamera.theta[0]);

  let forward = mult(yaw, gCamera.forward);
  forward = mult(pitch, forward);

  gCamera.currentAt = vec3(forward[0], forward[1], forward[2]);
  let at = add(gCamera.pos, gCamera.currentAt);
  gCubeAim.pos = gCamera.pos;

  up = mult(roll, up);

  up = vec3(up[0], up[1], up[2]);

  gCtx.view = lookAt(eye, at, up);

  // const lightViewMatrix = lookAt(
  //   vec3(gLight.pos[0], gLight.pos[1], gLight.pos[2]),
  //   at,
  //   vec3(gCamera.up[0], gCamera.up[1], gCamera.up[2])
  // );

  // gCtx.uniformMatrix4fv(gShader.uLightViewMatrix, false, flatten(lightViewMatrix));

  for (let i = 0; i < gObjects.length; i++) {
    const vao = gShader.VAO[i];

    if (!vao) {
      console.warn("VAO não encontrado para objeto: ", gObjects[i]);
      includeObjectShadow(i);
      makeVAO(i);
    }

    gCtx.bindVertexArray(vao);

    let obj = gObjects[i];

    let vTransform = obj.pos;
    let vRotation = obj.theta;
    let vScale = obj.escala;

    let rx = rotateX(vRotation[0]);
    let ry = rotateY(vRotation[1]);
    let rz = rotateZ(vRotation[2]);

    let modelRotation = mult(rz, mult(ry, rx));

    let modelScale = scale(vScale[0], vScale[1], vScale[2]);

    let modelTranslation = translate(vTransform[0], vTransform[1], vTransform[2]);

    let model = mult(modelTranslation, mult(modelRotation, modelScale));
    let modelView = mult(gCtx.view, model);
    let modelViewInv = inverse(modelView);
    let modelViewInvTrans = transpose(modelViewInv);

    gCtx.uniformMatrix4fv(gShader.uModel, false, flatten(model));
    gCtx.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));
    gCtx.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    gCtx.uniform4fv(gShader.uAmbient, mult(gLight.ambient, gObjects[i].material.ambient));
    gCtx.uniform4fv(gShader.uDiffuse, mult(gLight.diffuse, gObjects[i].material.diffuse));
    gCtx.uniform4fv(gShader.uSpecular, gLight.specular);
    gCtx.uniform1f(gShader.uAlphaSpecular, gObjects[i].material.alphaSpecular);

    gCtx.uniform1i(gShader.useVertexColor, !!gObjects[i].colors);
    gCtx.uniform1i(gShader.useTextureColor, !!gObjects[i].texture);
    gCtx.uniform1f(gShader.uDelta, SHADOW_DELTA);

    if (!!gObjects[i].texture) {
      gCtx.uniform1i(gShader.uTextureMap, gObjects[i].texture.textureUnitRef);
      gCtx.uniform1i(gShader.uShadowTextureMap, SHADOW_TEXTURE_UNIT);
    }

    gCtx.drawArrays(gCtx.TRIANGLES, 0, obj.vertexes.length);
  }

  gCtx.bindVertexArray(null);

  update(false, deltaTime);

  window.requestAnimationFrame(render);
}

function renderShadows() {
  gCtx.useProgram(gShaderShadow.program);

  gCtx.bindFramebuffer(gCtx.FRAMEBUFFER, gShaderShadow.framebuffer);

  gCtx.bindVertexArray(gShaderShadow.VAO);

  let yaw = rotateX(gCamera.theta[1]);
  let pitch = rotateZ(gCamera.theta[0]);

  let forward = mult(yaw, gCamera.forward);
  forward = mult(pitch, forward);

  gCamera.currentAt = vec3(forward[0], forward[1], forward[2]);
  let at = add(gCamera.pos, gCamera.currentAt);

  const lightViewMatrix = lookAt(
    vec3(gLight.pos[0], gLight.pos[1], gLight.pos[2]),
    at,
    vec3(gCamera.up[0], gCamera.up[1], gCamera.up[2])
  );

  gCtx.uniformMatrix4fv(gShaderShadow.uView, false, flatten(lightViewMatrix));

  let initialIndex = 0;
  for (let i = 0; i < gObjects.length; i++) {
    let obj = gObjects[i];

    let vTransform = obj.pos;
    let vRotation = obj.theta;
    let vScale = obj.escala;

    let rx = rotateX(vRotation[0]);
    let ry = rotateY(vRotation[1]);
    let rz = rotateZ(vRotation[2]);

    let modelRotation = mult(rz, mult(ry, rx));

    let modelScale = scale(vScale[0], vScale[1], vScale[2]);

    let modelTranslation = translate(vTransform[0], vTransform[1], vTransform[2]);

    let model = mult(modelTranslation, mult(modelRotation, modelScale));

    gCtx.uniformMatrix4fv(gShaderShadow.uModel, false, flatten(model));

    gCtx.drawArrays(gCtx.TRIANGLES, initialIndex, obj.vertexes.length);
    initialIndex += obj.vertexes.length;
  }

  gCtx.bindVertexArray(null);
  gCtx.bindFramebuffer(gCtx.FRAMEBUFFER, null);
}

/**
 * Calcula novas posições e rotações para os objetos em gObjects caso a cena não esteja pausada
 *
 * Também calcula a nova posição da câmera, com direção no vetor forward e tamanho de deslocamento vTrans
 */
function update(forcar, deltaTime) {
  if (!gPlaying && !forcar) return;

  for (let i = 0; i < gObjects.length; i++) {
    const objeto = gObjects[i];

    objeto.pos = add(objeto.pos, mult(deltaTime, objeto.vtrans));
    objeto.theta = add(objeto.theta, mult(deltaTime, objeto.vtheta));
  }

  handleCollision(deltaTime);
  handlePlayerGravity(deltaTime);
}

function handleCollision(deltaTime) {
  if (length(gCamera.mDir) > 0) {
    let normalizedDir = normalize(gCamera.mDir);
    let movement = mult(deltaTime * PLAYER_SPEED, normalizedDir);
    let pitch = rotateZ(gCamera.theta[0]);
    let movementRotated = mult(pitch, movement);

    let unnormalizedMovementDirRotated = mult(pitch, gCamera.mDir);
    const rayFrom = subtract(gCamera.pos, new vec3(0, 0, PLAYER_HEIGHT / 2));
    const rayDirection = vec3(
      unnormalizedMovementDirRotated[0],
      unnormalizedMovementDirRotated[1],
      unnormalizedMovementDirRotated[2]
    );

    const collisionCube = gWorld.hasCollisionWithWorld(new Ray(rayFrom, rayDirection, 5));
    if (collisionCube) {
      return;
    }

    gCamera.pos = add(gCamera.pos, vec3(movementRotated[0], movementRotated[1], movementRotated[2]));
  }
}

function handlePlayerGravity(deltaTime) {
  gCamera.pos = add(gCamera.pos, mult(deltaTime, vec3(0, 0, gPlayerVerticalVelocity)));

  const rayFrom = gCamera.pos;
  const rayDirection = normalize(vec3(0, 0, -1));

  const collisionCube = gWorld.hasCollisionWithWorld(new Ray(rayFrom, rayDirection, PLAYER_HEIGHT));
  if (collisionCube) {
    gCamera.pos = vec3(gCamera.pos[0], gCamera.pos[1], collisionCube.pos[2] + PLAYER_HEIGHT + HALF_CUBE_SIZE);
    gPlayerOnGround = true;
    gPlayerJumping = false;
    gPlayerVerticalVelocity = 0;
  } else {
    gPlayerOnGround = false;
  }

  if (!gPlayerOnGround) {
    gPlayerVerticalVelocity -= deltaTime * G;
  }
}

function handlePlayerJump() {
  if (gPlayerJumping) return;

  gPlayerJumping = true;
  gPlayerVerticalVelocity = PLAYER_JUMP_VELOCITY;
}

/* ==================================================================
    Vertex shader

    Possui 3 arrays de entrada: aPosition, aColor e aNormal;
    Uniforms necessários para o modelo de iluminação de Phong;
    Posição da luz;
*/
gVertexShaderSrc = `#version 300 es

    in vec3 aPosition;
    in vec3 aNormal;
    in vec4 aColor;
    in vec2 aTextureCoord;

    uniform mat4 uPerspective;
    uniform mat4 uView;
    uniform mat4 uModel;
    uniform mat4 uInverseTranspose;

    uniform vec4 uLightPos;
    uniform mat4 uLightProjectionMatrix;
    uniform mat4 uLightViewMatrix;
    
    out vec3 vNormal;
    out vec4 vColor;
    out vec3 vLight;
    out vec3 vView;
    out vec2 vTextureCoord;

    out vec4 vLightViewPosition;

    void main() {
        vec4 aPos = vec4(aPosition, 1.0);
        mat4 modelView = uView * uModel;
        
        gl_Position = uPerspective * modelView * aPos;

        vNormal = mat3(uInverseTranspose) * aNormal;
        vec4 pos = modelView * aPos;

        vLight = (uView * uLightPos - pos).xyz;
        vView = -(pos.xyz);
        vColor = aColor;
        vTextureCoord = aTextureCoord;
        vLightViewPosition = uLightProjectionMatrix * uLightViewMatrix * uModel * aPos;
    }
`;

/* ==================================================================
    Fragment shader

    Possui um array de entrada com a cor de cada vertice (recebido do vertex shader) e um de saida (cor final do pixel)

    Além disso, recebe a normal de cada vértice, direção da luz e direção da câmera.

    Também recebe via uniform, as componentes difusa, especular e ambient de cada vértice.

    Caso a flag useVertexColor esteja ativa, o vColor é usado no lugar do uniform uDiffuse
*/
gFragmentShaderSrc = `#version 300 es
    
    precision highp float;
    
    in vec4 vColor;
    in vec3 vNormal;
    in vec3 vLight;
    in vec3 vView;
    in vec2 vTextureCoord;
    in vec4 vLightViewPosition;

    out vec4 outColor;

    uniform vec4 uAmbient;
    uniform vec4 uDiffuse;
    uniform vec4 uSpecular; 
    uniform float uAlphaSpecular; 
    uniform sampler2D uTextureMap;

    uniform bool useVertexColor;
    uniform bool useTextureColor;

    uniform float uDelta;
    uniform sampler2D uShadowTextureMap;

    void main() {
      vec3 normalV = normalize(vNormal);
      vec3 lightV = normalize(vLight);
      vec3 viewV = normalize(vView);
      vec3 halfV = normalize(lightV + viewV);
    
      float kd = max(0.0, dot(normalV, lightV));

      vec4 diffuseColor = uDiffuse;

      if(useVertexColor) {
        diffuseColor = vColor;
      }

      vec4 diffuse = kd * diffuseColor;

      float ks = pow(max(0.0, dot(normalV, halfV)), uAlphaSpecular);
      
      vec4 specular = vec4(0, 0, 0, 0);
      if (kd > 0.0) {
        specular = ks * uSpecular;
      }

      vec4 textureColor = vec4(1, 1, 1, 1);
      
      if(useTextureColor) {
        textureColor = texture(uTextureMap, vTextureCoord);
      }
      
      outColor = diffuse + specular + uAmbient;
      outColor = outColor * textureColor;

      float shadowIntensity = 0.5;
      vec3 shadowCoord = 0.5*vLightViewPosition.xyz/vLightViewPosition.w + 0.5;
      float depth = texture(uShadowTextureMap, shadowCoord.xy).x;

      if (shadowCoord.z >= depth + uDelta) outColor = outColor * shadowIntensity;

      outColor.a = 1.0;

      // outColor = vec4(depth, depth, depth, 1.0);
    }
`;

gVertexShaderShadowSrc = `#version 300 es

      in vec3 aPosition;

      uniform mat4 uModel;
      uniform mat4 uView;
      uniform mat4 uPerspective;

      void main() {
          gl_Position = uPerspective * uView * uModel * vec4(aPosition, 1);
      }
`;

gFragmentShaderShadowSrc = `#version 300 es

      precision highp float;

      out vec4 outColor;

      void main() {
          outColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z , 1.0);
      }
`;
