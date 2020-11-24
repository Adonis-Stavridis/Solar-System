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

//------------------------------------------------------------------------------

// Global variables : textures, FBOs, prog_shaders, mesh, renderer, and a lot of
// parameters

let textures = {};

let mesh = null;
let meshRenderer = null;

let shaderProgram = null;

let planets = {
  'sun': {
    'distance': 0,
    'scale': 695700 ,
    'rotation': 0
  },
  'mercury': {
    'distance': 57.91,
    'scale': 2439,
    'rotation': 0
  },
  'venus': {
    'distance': 108.2,
    'scale': 6051,
    'rotation': 0
  },
  'earth':  {
    'distance': 149.6,
    'scale': 6371,
    'rotation': 0
  },
  'mars':  {
    'distance': 227.9,
    'scale': 3389,
    'rotation': 0
  },
  'jupiter':  {
    'distance': 778.5,
    'scale': 69911,
    'rotation': 0
  },
  'uranus':  {
    'distance': 1434,
    'scale': 25362,
    'rotation': 0
  },
  'neptune':  {
    'distance': 2871,
    'scale': 24622,
    'rotation': 0
  }
};

function init_wgl() {
  ewgl.continuous_update = true;

  // Generate all the textures
  for (var value in planets) {
    let tex = Texture2d(
      [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
      [gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR],
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
    tex.load('images/' + value + '.jpg', gl.RGB8);
    textures[value] = tex;
  }

  // texture cubeMap for the skybox
  // let tex_skybox = TextureCubeMap();
  // tex_skybox.load(["...", "...", "...", "...", "...", "..."]).then(update_wgl);

  // Create a mesh cube and his renderer
  // ...

  // Create all the shader programs
  shaderProgram = ShaderProgram(vertexShader, fragmentShader, 'basicShader');
  // ...

  // Create a mesh of a sphere and a renderer
  mesh = Mesh.Sphere(32);
  meshRenderer = mesh.renderer(0, 1, 2);
  // ...

  // Set the radius and the center of the scene
  ewgl.scene_camera.set_scene_radius(mesh.BB.radius);
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

  //   // User interface
  //   UserInterface.begin();
  //   // ...
  //   UserInterface.end();
}

// function getRandomMax(max) {
//   return Math.random() * Math.floor(max);
// }

// function getRandomMinMax(min, max) {
//   return Math.random() * (max - min) + min;
// }

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

  shaderProgram.bind();

  Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
  Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();
  for (var value in planets) {
    let modelMatrix = Matrix.mult(
      getDistance(planets[value]),
      Matrix.rotateX(90),
      getScale(planets[value])
    );
    Uniforms.uModeMat = modelMatrix;
    Uniforms.uTexture = textures[value].bind(0);
    meshRenderer.draw(gl.TRIANGLES);
  }

  // set scene center according to the selected object
  // ...

  // Compute the matrices (model - view - projection)
  // ...

  // Render skybox
  // ...
  // unbind_texture_cube(); will probably be useful

  // ATMOSPHERE
  // ...

  // Render Sun
  // ...

  // Render all the planets
  // ...

  // Render asteroids
  // ...

}

function getDistance(planet) {
  return Matrix.translate(planet['distance'] / planets['sun']['scale'], 0, 0);
}

function getScale(planet) {
  return Matrix.scale(planet['scale'] / planets['sun']['scale']);
}

function mousedown_wgl(ev) {
  // if you want to use mouse interaction
}

function onkeydown_wgl(k) {
  // if you want to use keyboard interaction
}

ewgl.launch_3d();
