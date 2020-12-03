"use strict"

//------------------------------------------------------------------------------
// GLSL
//------------------------------------------------------------------------------

// All the vertex and fragment shaders ...
var vertexShader = `#version 300 es
layout(location=0) in vec3 position_in;
layout(location=1) in vec3 normals_in;
layout(location=2) in vec2 texture_in;

uniform mat4 uProjMat;
uniform mat4 uViewMat;
uniform mat4 uModeMat;

out vec2 texCoord;

void main()
{
  texCoord = texture_in;
  gl_Position = uProjMat * uViewMat * uModeMat * vec4( position_in, 1.0 );
}
`;

var fragmentShader = `#version 300 es
precision highp float;

in vec2 texCoord;

uniform sampler2D uTexture;

out vec4 oFragmentColor;

void main()
{
  oFragmentColor = texture(uTexture, texCoord);
}
`;

var skyboxVertexShader = `#version 300 es
layout(location=0) in vec3 position_in;

uniform mat4 uSkybMat;

out vec3 texCoord;

void main() 
{
	texCoord = position_in;
	gl_Position = uSkybMat * vec4(position_in, 1.0);
}
`;

var skyboxFragmentShader = `#version 300 es
precision highp float;

in vec3 texCoord;

uniform samplerCube uSkybTex;

out vec4 oFragmentColor;

void main()
{
  oFragmentColor = texture(uSkybTex, texCoord);
}
`;

//------------------------------------------------------------------------------

const EARTH_DAY__PERIOD = 23.93;
const EARTH_YEAR_PERIOD = 365.25;

class Body {
  constructor(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, path) {
    this.name = name;
    this.distanceToSun = distanceToSun;
    this.scale = scale;
    this.incline = incline;
    this.positionOffset = getRandomMinMax(0, 360);
    this.yearPeriod = yearPeriod;
    this.dayPeriod = dayPeriod;

    let tex = Texture2d(
      [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_BASE_LEVEL, 0],
      [gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL],
      [gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE],
      [gl.TEXTURE_MAX_LEVEL, 5],
      [gl.TEXTURE_MAX_LOD, 0.0],
      [gl.TEXTURE_MIN_LOD, 5.0],
      [gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE]
    );
    tex.load('images/' + name + '.jpg', gl.RGB8);
    this.texture = tex;
    this.shader = shader;

    if (path) {
      this.path = Mesh.Tore(5, 100, 0.0000001, distanceToSun).renderer(0, 1, 2);
    } else {
      this.path = null;
    }

    this.anchor = Matrix.translate(0, 0, 0);
  }

  render() {
    this.shader.bind();

    Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
    Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();

    let inclineBodyMat = this.inclineBody();
    let dayPeriodBodyMat = this.dayPeriodBody();
    let alignBodyMat = this.alignBody();
    let scaleBodyMat = this.scaleBody();

    this.anchor = this.getAnchor();

    let modelMatrix = Matrix.mult(
      this.anchor,
      inclineBodyMat,
      dayPeriodBodyMat,
      alignBodyMat,
      scaleBodyMat
    );
    Uniforms.uModeMat = modelMatrix;
    Uniforms.uTexture = this.texture.bind(0);
    meshRenderer.draw(gl.TRIANGLES);

    let pathRenderer = this.path;
    if (pathRenderer) {
      modelMatrix = this.alignBody();
      Uniforms.uModeMat = modelMatrix;
      pathRenderer.draw(gl.LINES);
    }

    gl.useProgram(null);
  }

  get getName() {
    return this.name;
  }

  getAnchor() {
    let yearPeriodBodyMat = this.yearPeriodBody();
    let distanceToSunBodyMat = this.distanceToSunBody();

    return Matrix.mult(yearPeriodBodyMat, distanceToSunBodyMat);
  }

  scaleBody() {
    return Matrix.scale(this.scale);
  }

  alignBody() {
    return Matrix.rotateX(-90);
  }

  dayPeriodBody() {
    return Matrix.rotateY(ewgl.current_time * (360 / this.dayPeriod));
  }

  inclineBody() {
    return Matrix.rotateX(this.incline)
  }

  distanceToSunBody() {
    return Matrix.translate(this.distanceToSun, 0, 0);
  }

  yearPeriodBody() {
    return Matrix.rotateY((ewgl.current_time + this.positionOffset) * (360 / this.yearPeriod));
  }
}

//------------------------------------------------------------------------------

// Global variables : textures, FBOs, prog_shaders, mesh, renderer, and a lot of
// parameters

let skyboxTexture = {};

let mesh = null;
let meshRenderer = null;
let skyboxRenderer = null;

let shaderProgram = null;
let skyboxProgram = null;

let bodies = null;
let bodyNames = [];

let radio = null;
let cb = null;
let selectedBody = 'sun';

function init_wgl() {
  ewgl.continuous_update = true;

  // Create all the shader programs
  shaderProgram = ShaderProgram(vertexShader, fragmentShader, 'basicShader');
  skyboxProgram = ShaderProgram(skyboxVertexShader, skyboxFragmentShader, 'skyboxShader');

  bodies = {
    'sun': new Body('sun', 0, 1, 0, 27 * EARTH_DAY__PERIOD, 27 * EARTH_DAY__PERIOD, shaderProgram, false),
    'mercury': new Body('mercury', 2.2, 0.02, 0.1, 88.0, 58.64 * EARTH_DAY__PERIOD, shaderProgram, true),
    'venus': new Body('venus', 3, 0.05, 177, 224.7, -243.01 * EARTH_DAY__PERIOD, shaderProgram, true),
    'earth': new Body('earth', 4.5, 0.1, 24, EARTH_YEAR_PERIOD, EARTH_DAY__PERIOD, shaderProgram, true),
    'mars': new Body('mars', 6, 0.08, 25, 689.0, 24.62, shaderProgram, true),
    'jupiter': new Body('jupiter', 10, 0.4, 3, 11.87 * EARTH_YEAR_PERIOD, 9.92, shaderProgram, true),
    'saturn': new Body('saturn', 14, 0.3, 27, 29.45 * EARTH_YEAR_PERIOD, 10.65, shaderProgram, true),
    'uranus': new Body('uranus', 20, 0.2, 98, 84.07 * EARTH_YEAR_PERIOD, 17.24, shaderProgram, true),
    'neptune': new Body('neptune', 25, 0.1, 30, 164.89 * EARTH_YEAR_PERIOD, 16.11, shaderProgram, true)
  };

  // texture cubeMap for the skybox
  let tex_skybox = TextureCubeMap(
    [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
    [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
    [gl.TEXTURE_BASE_LEVEL, 0],
    [gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL],
    [gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE],
    [gl.TEXTURE_MAX_LEVEL, 5],
    [gl.TEXTURE_MAX_LOD, 0.0],
    [gl.TEXTURE_MIN_LOD, 5.0],
    [gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE]
  );
  tex_skybox.load([
    'images/skybox/skybox_milky_way.png',
    'images/skybox/skybox_milky_way.png',
    'images/skybox/skybox.png',
    'images/skybox/skybox.png',
    'images/skybox/skybox_milky_way.png',
    'images/skybox/skybox_milky_way.png'
  ]).then(update_wgl);
  skyboxTexture = tex_skybox;

  // Create a mesh cube and his renderer
  skyboxRenderer = Mesh.Cube().renderer(0);

  // Create a mesh of a sphere and a renderer
  mesh = Mesh.Sphere(32);
  meshRenderer = mesh.renderer(0, 1, 2);

  // Set the radius and the center of the scene
  ewgl.scene_camera.set_scene_radius(mesh.BB.radius * 15);
  ewgl.scene_camera.set_scene_center(mesh.BB.center);

  // Asteroid Belt
  // ---------------------------------------------------------------------------

  // Shader Program for asteroids
  // ...

  // Create a typed array to contain all the 4x4 model matrices of each asteroid
  //   let nbAsteroids = 0;

  //   const matrixData = new Float32Array(4 * 4 * nbAsteroids);
  //   // For each asteroid
  //   for (let i = 0; i < nbAsteroids; ++i) {
  //     var model;

  //     // Compute a matrix model

  //     // Put the matrix model a the right place in the typed array
  //     var index = 16 * i;
  //     matrixData.set(model.data, index);
  //   }

  //   // VBO for model matrix of each instance
  //   const matrixBuffer = VBO(matrixData);

  //   // Load the .obj mesh and use an instanced renderer (with 4 VBO, to recreate a 4x4 matrix) to get a lot of asteroids
  //   Mesh.loadObjFile("rock/rock.obj").then((meshes) => {
  //     rock_rend = meshes[0].instanced_renderer([
  //       [3, matrixBuffer, 1, 4 * 4, 0 * 4, 4],
  //       [4, matrixBuffer, 1, 4 * 4, 1 * 4, 4],
  //       [5, matrixBuffer, 1, 4 * 4, 2 * 4, 4],
  //       [6, matrixBuffer, 1, 4 * 4, 3 * 4, 4]],
  //       0, 1, 2);
  //   });
  //   // then, the matrice of an instance can be retrieved in a vertex shader with : layout(location=3) in mat4 instanceMatrix;
  //   // ----------------------------------------------------------------------------------------------------

  //   // ATMOSPHERE (GLOW)
  //   // Create Shader programs ...
  //   // Create FBOs with the linked textures ...

  // User interface
  UserInterface.begin(false, true);
  for (var body in bodies) {
    bodyNames.push(body);
  }
  radio = UserInterface.add_radio('V', 'Scene center', bodyNames, 0, updateSelectedBody);
  cb = UserInterface.add_check_box('Continuous update', true, updateContinuousUpdate);
  UserInterface.end();
}

function updateSelectedBody() {
  selectedBody = bodyNames[radio.value];
  update_wgl();
}

function updateContinuousUpdate() {
  ewgl.continuous_update = cb.checked;
}

function getRandomMax(max) {
  return Math.random() * Math.floor(max);
}

function getRandomMinMax(min, max) {
  return Math.random() * (max - min) + min;
}

// function resize_wgl(w, h) {
//   let d = Math.pow(2, 3);
//   // 
//   fbo1.resize(w / d, h / d);
//   fbo2.resize(w / d, h / d);
//   // Faire varier l'intensite selon la taille
//   // glow_intensity = 300 - ((w/100) * (h/100));
// }

// -----------------------------------------------------------------------------
//  DRAW
// -----------------------------------------------------------------------------
function draw_wgl() {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Compute the matrices (model - view - projection)

  // Render skybox
  skyboxProgram.bind();

  Uniforms.uSkybMat = ewgl.scene_camera.get_matrix_for_skybox();
  Uniforms.uSkybTex = skyboxTexture.bind(0);
  skyboxRenderer.draw(gl.TRIANGLES);
  unbind_texture_cube();

  // ATMOSPHERE
  // ...


  // set scene center according to the selected object
  ewgl.scene_camera.set_scene_center(
    bodies[selectedBody].getAnchor().position()
  );

  // Render Sun
  // Render all the bodies
  for (var body in bodies) {
    bodies[body].render();
  }

  // Render asteroids
  // ...

}

function mousedown_wgl(ev) {
  // if you want to use mouse interaction
}

function onkeydown_wgl(k) {
  // if you want to use keyboard interaction
}

ewgl.launch_3d();
