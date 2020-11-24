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

let bodies = {
  'sun': {
    'distance': 0,
    'scale': 0.1,
    'rotation': 0,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': 0
  },
  'mercury': {
    'distance': 0.2,
    'scale': 0.002,
    'rotation': 0.1,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': getRandomMinMax(1, 10)
  },
  'venus': {
    'distance': 0.4,
    'scale': 0.005,
    'rotation': 177,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': getRandomMinMax(1, 10)
  },
  'earth':  {
    'distance': 0.7,
    'scale': 0.01,
    'rotation': 24,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': getRandomMinMax(1, 10)
  },
  'mars':  {
    'distance': 1,
    'scale': 0.008,
    'rotation': 25,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': getRandomMinMax(1, 10)
  },
  'jupiter':  {
    'distance': 1.8,
    'scale': 0.04,
    'rotation': 3,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': getRandomMinMax(1, 10)
  },
  'saturn': {
    'distance': 2.2,
    'scale': 0.03,
    'rotation': 27,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': getRandomMinMax(1, 10)
  },
  'uranus':  {
    'distance': 2.6,
    'scale': 0.02,
    'rotation': 98,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': getRandomMinMax(1, 10)
  },
  'neptune':  {
    'distance': 3,
    'scale': 0.01,
    'rotation': 30,
    'positionOffset': getRandomMinMax(0, 360),
    'year': getRandomMinMax(1, 10),
    'day': getRandomMinMax(1, 10)
  }
};

let labels = [];
let radio = null;
let selectedBody = 'sun';

function init_wgl() {
  ewgl.continuous_update = true;

  // Generate all the textures
  for (var body in bodies) {
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
    tex.load('images/' + body + '.jpg', gl.RGB8);
    textures[body] = tex;
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

  for (var body in bodies) {
    if (body == 'sun') {
      bodies[body]['path'] = null;
    } else {
      bodies[body]['path'] = Mesh.Tore(5, 100, 0.0000001, bodies[body]['distance']).renderer(0, 1, 2);
    }
  }

  // Set the radius and the center of the scene
  ewgl.scene_camera.set_scene_radius(mesh.BB.radius * 5);
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
  labels = [];
  for (var body in bodies) {
    labels.push(body);
  }
  radio = UserInterface.add_radio('V', 'Scene center', labels, 0, updateSelectedBody);
  UserInterface.end();
}

function updateSelectedBody() {
  selectedBody = labels[radio.value];
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

  // set scene center according to the selected object
  ewgl.scene_camera.set_scene_center(
    Matrix.mult(
      Matrix.rotateY((ewgl.current_time + bodies[selectedBody]['positionOffset']) * bodies[selectedBody]['year']),
      Matrix.translate(bodies[selectedBody]['distance'], 0, 0)
    ).position()
  );

  // Compute the matrices (model - view - projection)
  // ...

  // Render skybox
  // ...
  // unbind_texture_cube(); will probably be useful

  // ATMOSPHERE
  // ...

  // Render Sun
  // Render all the bodies
  shaderProgram.bind();

  Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
  Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();
  for (var body in bodies) {
    let modelMatrix = Matrix.mult(
      Matrix.rotateY((ewgl.current_time + bodies[body]['positionOffset']) * bodies[body]['year']),
      Matrix.translate(bodies[body]['distance'], 0, 0),
      Matrix.rotateX(bodies[body]['rotation']),
      Matrix.rotateY(ewgl.current_time * bodies[body]['day']),
      Matrix.rotateX(-90),
      Matrix.scale(bodies[body]['scale'])
    );
    Uniforms.uModeMat = modelMatrix;
    Uniforms.uTexture = textures[body].bind(0);
    meshRenderer.draw(gl.TRIANGLES);

    let pathRenderer = bodies[body]['path'];
    if (pathRenderer) {
      modelMatrix = Matrix.mult(
        Matrix.rotateX(-90)
      );
      Uniforms.uModeMat = modelMatrix;
      pathRenderer.draw(gl.LINES);
    }
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
