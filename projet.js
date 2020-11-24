"use strict"

//--------------------------------------------------------------------------------------------------------
// GLSL
//--------------------------------------------------------------------------------------------------------

// All the vertex and fragment shaders ...

//--------------------------------------------------------------------------------------------------------

// Global variables : textures, FBOs, prog_shaders, mesh, renderer, and a lot of parameters

function init_wgl() {
  ewgl.continuous_update = true;

  // Generate all the textures
  let tex = Texture2d();
  tex.load("path", gl.RGB8);
  // ...

  // texture cubeMap for the skybox
  let tex_skybox = TextureCubeMap();
  tex_skybox.load(["...", "...", "...", "...", "...", "..."]).then(update_wgl);
  // Create a mesh cube and his renderer
  // ...

  // Create all the shader programs
  // ...

  // Create a mesh of a sphere and a renderer
  let mesh;
  // ...

  // Set the radius and the center of the scene
  ewgl.scene_camera.set_scene_radius(mesh.BB.radius);
  ewgl.scene_camera.set_scene_center(mesh.BB.center);

  // Asteroid Belt
  // ----------------------------------------------------------------------------------------------------

  // Shader Program for asteroÃ¯ds
  // ...

  // Create a typed array to contain all the 4x4 model matrices of each asteroÃ¯d
  const matrixData = new Float32Array(4 * 4 * nbAsteroids);
  // For each asteroÃ¯d
  for (let i = 0; i < nbAsteroids; ++i) {
    var model;

    // Compute a matrix model

    // Put the matrix model a the right place in the typed array
    var index = 16 * i;
    matrixData.set(model.data, index);
  }

  // VBO for model matrix of each instance
  const matrixBuffer = VBO(matrixData);

  // Load the .obj mesh and use an instanced renderer (with 4 VBO, to recreate a 4x4 matrix) to get a lot of asteroÃ¯ds
  Mesh.loadObjFile("rock/rock.obj").then((meshes) => {
    rock_rend = meshes[0].instanced_renderer([
      [3, matrixBuffer, 1, 4 * 4, 0 * 4, 4],
      [4, matrixBuffer, 1, 4 * 4, 1 * 4, 4],
      [5, matrixBuffer, 1, 4 * 4, 2 * 4, 4],
      [6, matrixBuffer, 1, 4 * 4, 3 * 4, 4]],
      0, 1, 2);
  });
  // then, the matrice of an instance can be retrieved in a vertex shader with : layout(location=3) in mat4 instanceMatrix;
  // ----------------------------------------------------------------------------------------------------

  // ATMOSPHERE (GLOW)
  // Create Shader programs ...
  // Create FBOs with the linked textures ...

  // User interface
  UserInterface.begin();
  // ...
  UserInterface.end();
}

function getRandomMax(max) {
  return Math.random() * Math.floor(max);
}

function getRandomMinMax(min, max) {
  return Math.random() * (max - min) + min;
}

function resize_wgl(w, h) {
  let d = Math.pow(2, 3);
  // 
  fbo1.resize(w / d, h / d);
  fbo2.resize(w / d, h / d);
  // Faire varier l'intensiter selon la taille
  // glow_intensity = 300 - ((w/100) * (h/100));
}

// -------------------------------------------------------------------------------------------------------------------------------------
//  DRAW
// -------------------------------------------------------------------------------------------------------------------------------------
function draw_wgl() {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

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

function mousedown_wgl(ev) {
  // if you want to use mouse interaction
}

function onkeydown_wgl(k) {
  // if you want to use keyboard interaction
}

ewgl.launch_3d();
