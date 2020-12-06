"use strict"

// #############################################################################
//  SHADERS
// #############################################################################

// Skybox vertex shader
let skyboxVertexShader = `#version 300 es
layout(location=0) in vec3 position_in;

uniform mat4 uSkybMat;

out vec3 texCoord_out;

void main() 
{
	texCoord_out = position_in;
	gl_Position = uSkybMat * vec4(position_in, 1.0);
}
`;

// Skybox fragment shader
let skyboxFragmentShader = `#version 300 es
precision highp float;

in vec3 texCoord_out;

uniform samplerCube uSkybTex;

out vec4 oFragmentColor;

void main()
{
  oFragmentColor = texture(uSkybTex, texCoord_out);
}
`;

// Basic vertex shader (for sun and path)
let basicVertexShader = `#version 300 es
layout(location=0) in vec3 position_in;
layout(location=1) in vec3 normal_in;
layout(location=2) in vec2 texture_in;

uniform mat4 uProjMat;
uniform mat4 uViewMat;
uniform mat4 uModeMat;

out vec2 texCoord_out;

void main()
{
  texCoord_out = texture_in;
  gl_Position = uProjMat * uViewMat * uModeMat * vec4(position_in, 1.0);
}
`;

// Basic fragment shader
let basicFragmentShader = `#version 300 es
precision highp float;

in vec2 texCoord_out;

uniform sampler2D uTexture;

out vec4 oFragmentColor;

void main()
{
  oFragmentColor = texture(uTexture, texCoord_out);
}
`;

// Planet vertex shader
let planetVertexShader = `#version 300 es
layout(location=0) in vec3 position_in;
layout(location=1) in vec3 normal_in;
layout(location=2) in vec2 texture_in;

uniform mat4 uProjMat;
uniform mat4 uViewMat;
uniform mat4 uModeMat;
uniform mat3 uNormMat;

out vec2 texCoord_out;
out vec3 position_out;
out vec3 normal_out;

void main()
{
  texCoord_out = texture_in;
  position_out = (uViewMat * uModeMat * vec4(position_in, 1.0)).xyz;
  normal_out = normalize(uNormMat * normal_in);

  gl_Position = uProjMat * uViewMat * uModeMat * vec4(position_in, 1.0);
}
`;

// Planet fragment shader
let planetFragmentShader = `#version 300 es
precision highp float;

#define M_PI 3.14159265358979

in vec2 texCoord_out;
in vec3 position_out;
in vec3 normal_out;

uniform sampler2D uTexture;
uniform float uLightIntensity;
uniform vec3 uLightPosition;

out vec4 oFragmentColor;

void main()
{
  vec3 Ia = uLightIntensity * vec3(0.0, 0.0, 0.0);

  vec4 tex = texture(uTexture, texCoord_out);

  vec3 lightDirection = normalize(uLightPosition - position_out);
  float diffuseElement = max(0.0, dot(normal_out, lightDirection));

  vec3 Id = uLightIntensity * tex.rgb * vec3(diffuseElement);
  Id = Id / M_PI;

  float uNs = 128.0;
  vec3 viewDirection = normalize(-position_out.xyz);
  vec3 halfDirection = normalize(viewDirection + lightDirection);
  float specularElement = pow(dot(normal_out, halfDirection), uNs);

  vec3 Is = uLightIntensity * vec3(1.0, 1.0, 1.0) * vec3(specularElement);
  Is /= (uNs + 2.0) / (2.0 * M_PI);

  vec3 color = (0.3 * Ia) + (0.3 * Id) + (0.3 * Is);

  oFragmentColor = vec4(color, 1.0);
}
`;

// Earth fragment shader
let earthFragmentShader = `#version 300 es
precision highp float;

#define M_PI 3.14159265358979

in vec2 texCoord_out;
in vec3 position_out;
in vec3 normal_out;

uniform sampler2D uTexture;
uniform sampler2D uTextureClouds;
uniform sampler2D uTextureNight;
uniform float uLightIntensity;
uniform vec3 uLightPosition;

out vec4 oFragmentColor;

void main()
{
  vec3 Ia = uLightIntensity * vec3(0.0, 0.0, 0.0);

  vec4 tex = texture(uTexture, texCoord_out);
  vec4 texClouds = texture(uTextureClouds, texCoord_out);
  vec4 texNight = texture(uTextureNight, texCoord_out);

  vec3 lightDirection = normalize(uLightPosition - position_out);
  float diffuseElement = max(0.0, dot(normal_out, lightDirection));
  
  vec3 IdDay = uLightIntensity * tex.rgb * vec3(diffuseElement);
  vec3 IdClouds = uLightIntensity * texClouds.rgb  * vec3(diffuseElement);
  vec3 IdTemp = IdDay + IdClouds;
  vec3 IdNight = uLightIntensity * texNight.rgb * vec3(max(0.0, 1.0 - (2.0 * diffuseElement)));
  vec3 Id = mix(IdTemp, IdNight, 0.5);
  Id = Id / M_PI;

  float uNs = 128.0;
  vec3 viewDirection = normalize(-position_out.xyz);
  vec3 halfDirection = normalize(viewDirection + lightDirection);
  float specularElement = pow(dot(normal_out, halfDirection), uNs);

  vec3 Is = uLightIntensity * vec3(1.0, 1.0, 1.0) * vec3(specularElement);
  Is /= (uNs + 2.0) / (2.0 * M_PI);

  vec3 color = (0.3 * Ia) + (0.3 * Id) + (0.3 * Is);

  oFragmentColor = vec4(color, 1.0);
}
`;

// Asteroid vertex shader
let asteroidVertexShader = `#version 300 es
layout(location=0) in vec3 position_in;
layout(location=1) in vec3 normal_in;
layout(location=2) in vec2 texture_in;
layout(location=3) in mat4 buffer_in;

uniform mat4 uProjMat;
uniform mat4 uViewMat;
uniform mat4 uModeMat;

out vec2 texCoord_out;

void main()
{
  texCoord_out = texture_in;
  gl_Position = uProjMat * uViewMat * uModeMat * buffer_in * vec4(position_in, 1.0);
}
`;

// #############################################################################
//  FUNCTIONS
// #############################################################################

// Get random number with ceiling
function getRandomMax(max) {
  return Math.random() * Math.floor(max);
}

// Get random number with floor and ceiling
function getRandomMinMax(min, max) {
  return Math.random() * (max - min) + min;
}

// Interface function to pause/unpause application
function updatePause() {
  if (userInterface.pauseCheckbox.checked) {
    pause_wgl();
  } else {
    update_wgl();
  }
}

// Interface function to update selected body
function updateSelectedBody() {
  userInterface.selectedBody = userInterface.bodyNames[userInterface.sceneCenterRadio.value];
}

// Interface function to render paths or not
function updateRenderPathBool() {
  userInterface.renderPathBool = userInterface.renderPathCheckbox.checked;
}

// #############################################################################
//  CLASSES
// #############################################################################

class Skybox {
  constructor(shader, skyboxRenderer) {
    let textures = [
      'images/skybox/skybox_milky_way.png',
      'images/skybox/skybox_milky_way.png',
      'images/skybox/skybox.png',
      'images/skybox/skybox.png',
      'images/skybox/skybox_milky_way.png',
      'images/skybox/skybox_milky_way.png'
    ];

    let tex = TextureCubeMap(
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
    tex.load(textures).then(update_wgl);
    this.texture = tex;

    this.shader = shader;
    this.skyboxRenderer = skyboxRenderer;
  }

  render() {
    this.shader.bind();

    Uniforms.uSkybMat = ewgl.scene_camera.get_matrix_for_skybox();
    Uniforms.uSkybTex = this.texture.bind(0);
    this.skyboxRenderer.draw(gl.TRIANGLES);
    unbind_texture_cube();

    gl.useProgram(null);
  }
}

const EARTH_DAY__PERIOD = 23.93;
const EARTH_YEAR_PERIOD = 365.25;

class Body {
  constructor(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer) {
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

    this.meshRenderer = meshRenderer;

    this.anchor = Matrix.translate(0, 0, 0);
  }

  get getName() {
    return this.name;
  }

  get getAnchor() {
    let yearPeriodBodyMat = this.yearPeriodBody();
    let distanceToSunBodyMat = this.distanceToSunBody();

    return Matrix.mult(yearPeriodBodyMat, distanceToSunBodyMat);
  }

  scaleBody(scale = this.scale) {
    return Matrix.scale(scale);
  }

  alignBody() {
    return Matrix.rotateX(-90);
  }

  dayPeriodBody(dayPeriod = this.dayPeriod) {
    return Matrix.rotateY(ewgl.current_time * (360 / dayPeriod));
  }

  inclineBody(incline = this.incline) {
    return Matrix.rotateX(incline)
  }

  distanceToSunBody(distanceToSun = this.distanceToSun) {
    return Matrix.translate(distanceToSun, 0, 0);
  }

  yearPeriodBody(yearPeriod = this.yearPeriod) {
    return Matrix.rotateY((ewgl.current_time * (360 / yearPeriod)) + this.positionOffset);
  }
}

class Sun extends Body {
  constructor(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer, lightIntensity) {
    super(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer);
    this.lightIntensity = lightIntensity;
  }

  render() {
    this.shader.bind();

    Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
    Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();

    let inclineBodyMat = this.inclineBody();
    let dayPeriodBodyMat = this.dayPeriodBody();
    let alignBodyMat = this.alignBody();
    let scaleBodyMat = this.scaleBody();

    let modelMatrix = Matrix.mult(
      this.getAnchor,
      inclineBodyMat,
      dayPeriodBodyMat,
      alignBodyMat,
      scaleBodyMat
    );
    Uniforms.uModeMat = modelMatrix;
    Uniforms.uTexture = this.texture.bind(0);
    this.meshRenderer.draw(gl.TRIANGLES);

    gl.useProgram(null);
  }

  renderPath() { }

  get getLightPosition() {
    return Matrix.mult(
      ewgl.scene_camera.get_view_matrix(),
      this.anchor
    ).transform(Vec3());
  }

  get getLightIntensity() {
    return this.lightIntensity;
  }
}

class Planet extends Body {
  constructor(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer, pathShader, sun) {
    super(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer);
    this.pathShader = pathShader;
    this.pathRenderer = Mesh.Tore(5, 100, 0.0000001, distanceToSun).renderer(0, 1, 2);
    this.sun = sun;
  }

  render() {
    this.shader.bind();

    Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
    Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();

    let inclineBodyMat = this.inclineBody();
    let dayPeriodBodyMat = this.dayPeriodBody();
    let alignBodyMat = this.alignBody();
    let scaleBodyMat = this.scaleBody();

    let modelMatrix = Matrix.mult(
      this.getAnchor,
      inclineBodyMat,
      dayPeriodBodyMat,
      alignBodyMat,
      scaleBodyMat
    );
    Uniforms.uModeMat = modelMatrix;
    let mvm = Matrix.mult(ewgl.scene_camera.get_view_matrix(), modelMatrix);
    Uniforms.uNormMat = mvm.inverse3transpose();

    Uniforms.uTexture = this.texture.bind(0);
    Uniforms.uLightPosition = this.sun.getLightPosition;
    Uniforms.uLightIntensity = this.sun.getLightIntensity;
    this.meshRenderer.draw(gl.TRIANGLES);

    gl.useProgram(null);
  }

  renderPath() {
    this.pathShader.bind();

    Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
    Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();

    let modelMatrix = this.alignBody();
    Uniforms.uModeMat = modelMatrix;
    Uniforms.uTexture = this.texture.bind(0);
    this.pathRenderer.draw(gl.LINES);

    gl.useProgram(null);
  }
}

class Earth extends Planet {
  constructor(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer, pathShader, sun, moonShader) {
    super(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer, pathShader, sun);

    let texClouds = Texture2d(
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
    texClouds.load('images/' + name + '_clouds.jpg', gl.RGB8);
    this.textureClouds = texClouds;

    let texNight = Texture2d(
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
    texNight.load('images/' + name + '_night.jpg', gl.RGB8);
    this.textureNight = texNight;

    let texMoon = Texture2d(
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
    texMoon.load('images/moon.jpg', gl.RGB8);
    this.textureMoon = texMoon;

    this.moonShader = moonShader;
    this.moonOrbitPeriod = 29 * EARTH_DAY__PERIOD;
  }

  render() {
    this.shader.bind();

    Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
    Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();

    let inclineBodyMat = this.inclineBody();
    let dayPeriodBodyMat = this.dayPeriodBody();
    let alignBodyMat = this.alignBody();
    let scaleBodyMat = this.scaleBody();

    let modelMatrix = Matrix.mult(
      this.getAnchor,
      inclineBodyMat,
      dayPeriodBodyMat,
      alignBodyMat,
      scaleBodyMat
    );
    Uniforms.uModeMat = modelMatrix;
    let mvm = Matrix.mult(ewgl.scene_camera.get_view_matrix(), modelMatrix);
    Uniforms.uNormMat = mvm.inverse3transpose();

    Uniforms.uTexture = this.texture.bind(0);
    Uniforms.uTextureClouds = this.textureClouds.bind(1);
    Uniforms.uTextureNight = this.textureNight.bind(2);
    Uniforms.uLightPosition = this.sun.getLightPosition;
    Uniforms.uLightIntensity = this.sun.getLightIntensity;
    this.meshRenderer.draw(gl.TRIANGLES);

    this.moonShader.bind();

    Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
    Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();

    let moonOrbitPeriodMat = this.yearPeriodBody(this.moonOrbitPeriod);
    let distanceToEarthMat = this.distanceToSunBody(0.3);
    dayPeriodBodyMat = this.dayPeriodBody(this.moonOrbitPeriod);
    scaleBodyMat = this.scaleBody(0.01);

    modelMatrix = Matrix.mult(
      this.getAnchor,
      moonOrbitPeriodMat,
      distanceToEarthMat,
      dayPeriodBodyMat,
      alignBodyMat,
      scaleBodyMat
    );
    Uniforms.uModeMat = modelMatrix;
    mvm = Matrix.mult(ewgl.scene_camera.get_view_matrix(), modelMatrix);
    Uniforms.uNormMat = mvm.inverse3transpose();

    Uniforms.uTexture = this.textureMoon.bind(0);
    this.meshRenderer.draw(gl.TRIANGLES);

    gl.useProgram(null);
  }
}

class Saturn extends Planet {
  constructor(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer, pathShader, sun) {
    super(name, distanceToSun, scale, incline, yearPeriod, dayPeriod, shader, meshRenderer, pathShader, sun);
    
    this.ringRenderer = Mesh.Tore(5, 100, 0.1, 0.5).renderer(0, 1, 2);
  }

  render() {
    this.shader.bind();

    Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
    Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();

    let inclineBodyMat = this.inclineBody();
    let dayPeriodBodyMat = this.dayPeriodBody();
    let alignBodyMat = this.alignBody();
    let scaleBodyMat = this.scaleBody();

    let modelMatrix = Matrix.mult(
      this.getAnchor,
      inclineBodyMat,
      dayPeriodBodyMat,
      alignBodyMat,
      scaleBodyMat
    );
    Uniforms.uModeMat = modelMatrix;
    let mvm = Matrix.mult(ewgl.scene_camera.get_view_matrix(), modelMatrix);
    Uniforms.uNormMat = mvm.inverse3transpose();

    Uniforms.uTexture = this.texture.bind(0);
    Uniforms.uLightPosition = this.sun.getLightPosition;
    Uniforms.uLightIntensity = this.sun.getLightIntensity;
    this.meshRenderer.draw(gl.TRIANGLES);

    modelMatrix = Matrix.mult(
      this.getAnchor,
      Matrix.rotateY(-45),
      inclineBodyMat,
      dayPeriodBodyMat,
      alignBodyMat,
      Matrix.scale(1.0, 1.0, 0.01)
    );
    Uniforms.uModeMat = modelMatrix;
    mvm = Matrix.mult(ewgl.scene_camera.get_view_matrix(), modelMatrix);
    Uniforms.uNormMat = mvm.inverse3transpose();
    this.ringRenderer.draw(gl.TRIANGLES);

    gl.useProgram(null);
  }
}

class AsteroidBelt {
  constructor(name, distanceToSun, shader, number, threshold) {
    this.name = name;
    this.distanceToSun = distanceToSun;
    this.positionOffset = getRandomMinMax(0, 360);
    this.shader = shader;
    this.number = number;

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
    tex.load('rock/rock.png', gl.RGB8);
    this.texture = tex;

    const matrixData = new Float32Array(4 * 4 * number);
    for (let i = 0; i < number; ++i) {
      let cosinus = distanceToSun * Math.cos(i);
      let sinus = distanceToSun * Math.sin(i);

      let model = Matrix.mult(
        Matrix.translate(
          getRandomMinMax(cosinus - threshold, cosinus + threshold),
          getRandomMinMax(-0.25, 0.25),
          getRandomMinMax(sinus - threshold, sinus + threshold)
        ),
        Matrix.rotateZ(getRandomMinMax(0, 360)),
        Matrix.rotateY(getRandomMinMax(0, 360)),
        Matrix.rotateX(getRandomMinMax(0, 360)),
        Matrix.scale(getRandomMinMax(0.005, 0.01))
      );

      let index = 16 * i;
      matrixData.set(model.data, index);
    }

    const matrixBuffer = VBO(matrixData);

    this.meshRenderer = null;
    Mesh.loadObjFile("rock/rock.obj").then((meshes) => {
      this.meshRenderer = meshes[0].instanced_renderer([
        [3, matrixBuffer, 1, 4 * 4, 0 * 4, 4],
        [4, matrixBuffer, 1, 4 * 4, 1 * 4, 4],
        [5, matrixBuffer, 1, 4 * 4, 2 * 4, 4],
        [6, matrixBuffer, 1, 4 * 4, 3 * 4, 4]
      ], 0, 1, 2);
    });
  }

  render() {
    if (!this.meshRenderer) {
      return;
    }

    this.shader.bind();

    Uniforms.uProjMat = ewgl.scene_camera.get_projection_matrix();
    Uniforms.uViewMat = ewgl.scene_camera.get_view_matrix();
    Uniforms.uModeMat = Matrix.rotateY(ewgl.current_time + this.positionOffset);
    Uniforms.uTexture = this.texture.bind(0);
    this.meshRenderer.draw(gl.TRIANGLES, this.number);

    gl.useProgram(null);
  }

  renderPath() { }

  get getAnchor() {
    return Matrix.mult(
      Matrix.rotateY(ewgl.current_time + this.positionOffset),
      Matrix.translate(this.distanceToSun, 0.0, 0.0)
    );
  }
}

class Interface {
  constructor(bodies) {
    this.bodyNames = [];
    this.selectedBody = 'sun';
    this.renderPathBool = true;

    for (let body in bodies) {
      this.bodyNames.push(body);
    }

    UserInterface.begin(false, true);
    UserInterface.set_dark_theme();
    UserInterface.add_br();
    this.pauseCheckbox = UserInterface.add_check_box('Pause', false, updatePause);
    UserInterface.add_br();
    this.sceneCenterRadio = UserInterface.add_radio('V', 'Scene center', this.bodyNames, 0, updateSelectedBody);
    UserInterface.add_br();
    this.renderPathCheckbox = UserInterface.add_check_box('Render path', this.renderPathBool, updateRenderPathBool);
    UserInterface.add_br();
    UserInterface.end();
  }

  get getSelectedBody() {
    return this.selectedBody;
  }

  get getRenderPathBool() {
    return this.renderPathBool;
  }
}

// #############################################################################
//  APPLICATION
// #############################################################################

// Global variables
let bodies = null;
let skybox = null;
let userInterface = null;

// -----------------------------------------------------------------------------
//  INIT
// -----------------------------------------------------------------------------
function init_wgl() {
  ewgl.continuous_update = true;

  // Setup skybox
  let skyboxShader = ShaderProgram(skyboxVertexShader, skyboxFragmentShader, 'skyboxShader');
  let skyboxRenderer = Mesh.Cube().renderer(0, 1, 2, 3, 4);

  // Create skybox
  skybox = new Skybox(skyboxShader, skyboxRenderer);

  // Setup bodies
  let basicShader = ShaderProgram(basicVertexShader, basicFragmentShader, 'basicShader');
  let planetShader = ShaderProgram(planetVertexShader, planetFragmentShader, 'planetShader');
  let earthShader = ShaderProgram(planetVertexShader, earthFragmentShader, 'earthShader');
  let asteroidShader = ShaderProgram(asteroidVertexShader, basicFragmentShader, 'asteroidShader');
  let mesh = Mesh.Sphere(32);
  let meshRenderer = mesh.renderer(0, 1, 2, 3, 4);

  // Create bodies
  let sun = new Sun('sun', 0, 1, 0, 27 * EARTH_DAY__PERIOD, 27 * EARTH_DAY__PERIOD, basicShader, meshRenderer, 10.0);
  bodies = {
    'sun': sun,
    'mercury': new Planet('mercury', 2.2, 0.02, 0.1, 88.0, 58.64 * EARTH_DAY__PERIOD, planetShader, meshRenderer, basicShader, sun),
    'venus': new Planet('venus', 3, 0.05, 177, 224.7, -243.01 * EARTH_DAY__PERIOD, planetShader, meshRenderer, basicShader, sun),
    'earth': new Earth('earth', 4.5, 0.1, 24, EARTH_YEAR_PERIOD, EARTH_DAY__PERIOD, earthShader, meshRenderer, basicShader, sun, planetShader),
    'mars': new Planet('mars', 6, 0.08, 25, 689.0, 24.62, planetShader, meshRenderer, basicShader, sun),
    'asteroidBelt': new AsteroidBelt('asteroids', 11, asteroidShader, 5000, 1.0),
    'jupiter': new Planet('jupiter', 16, 0.4, 3, 11.87 * EARTH_YEAR_PERIOD, 9.92, planetShader, meshRenderer, basicShader, sun),
    'saturn': new Saturn('saturn', 26, 0.3, 27, 29.45 * EARTH_YEAR_PERIOD, 10.65, planetShader, meshRenderer, basicShader, sun),
    'uranus': new Planet('uranus', 34, 0.2, 98, 84.07 * EARTH_YEAR_PERIOD, 17.24, planetShader, meshRenderer, basicShader, sun),
    'neptune': new Planet('neptune', 40, 0.1, 30, 164.89 * EARTH_YEAR_PERIOD, 16.11, planetShader, meshRenderer, basicShader, sun)
  };

  // Setup scene
  ewgl.scene_camera.set_scene_radius(mesh.BB.radius * 100);
  ewgl.scene_camera.set_scene_center(mesh.BB.center);

  // Create User Interface
  userInterface = new Interface(bodies);

  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
}

// -----------------------------------------------------------------------------
//  DRAW
// -----------------------------------------------------------------------------
function draw_wgl() {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Set scene center
  ewgl.scene_camera.set_scene_center(
    bodies[userInterface.getSelectedBody].getAnchor.position()
  );

  // Render skybox
  skybox.render();

  // Render all the bodies (sun, planets, asteroids)
  for (let body in bodies) {
    bodies[body].render();
    if (userInterface.renderPathBool) {
      bodies[body].renderPath();
    }
  }
}

function mousedown_wgl(ev) {
  // if you want to use mouse interaction
}

function onkeydown_wgl(k) {
  // if you want to use keyboard interaction
}

ewgl.launch_3d();

// #############################################################################
//  TODO
// #############################################################################

// function resize_wgl(w, h) {
//   let d = Math.pow(2, 3);
//   fbo1.resize(w / d, h / d);
//   fbo2.resize(w / d, h / d);
// Faire varier l'intensite selon la taille
// glow_intensity = 300 - ((w/100) * (h/100));
// }
