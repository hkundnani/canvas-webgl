const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const palettes = require("nice-color-palettes");
const eases = require("eases");
const BezierEasing = require("bezier-easing");
const glsl = require("glslify");
// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const settings = {
  dimensions: [512, 512],
  fps: 24,
  duration: 4,
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor("#f5f5f5", 1);

  // Setup a camera
  // const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  // camera.position.set(2, 2, -4);
  // camera.lookAt(new THREE.Vector3());
  const camera = new THREE.OrthographicCamera();
  const fragmentShader = `
    varying vec2 vUv;
    uniform vec3 color;
    void main() {
      gl_FragColor = vec4(vec3(color * vUv.x), 1.0);
    }
  `;

  const vertexShader = glsl(`
    varying vec2 vUv;
    uniform float time;

    #pragma glslify: noise = require('glsl-noise/simplex/4d');

    void main() {
      vUv = uv;
      vec3 pos = position.xyz;
      pos += normal * noise(vec4(pos, time));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `);
  // Setup camera controller
  // const controls = new THREE.OrbitControls(camera, context.canvas);
  const colorCount = random.rangeFloor(1, 6);
  const palette = random.shuffle(random.pick(palettes)).slice(0, colorCount);
  // Setup your scene
  const scene = new THREE.Scene();
  const box = new THREE.BoxGeometry(1, 1, 1);
  const meshes = [];
  for (let i = 0; i < 40; i++) {
    const mesh = new THREE.Mesh(
      box,
      new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        // color: random.pick(palette),
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(random.pick(palette)) }
        }
        // roughness: 0.75,
        // flatShading: true
      })
    );
    mesh.position.set(
      random.range(-1, 1),
      random.range(-1, 1),
      random.range(-1, 1)
    );
    mesh.scale.set(
      random.range(-1, 1),
      random.range(-1, 1),
      random.range(-1, 1)
    );
    mesh.scale.multiplyScalar(0.5);
    scene.add(mesh);
    meshes.push(mesh);
  }

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight("hsl(0, 0%, 20%)"));

  // Add some light
  const light = new THREE.PointLight("#fff", 1);
  light.position.set(0, 0, 4);
  scene.add(light);

  const easeFn = BezierEasing(0.67, 0.03, 0.29, 0.99);
  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      // camera.aspect = viewportWidth / viewportHeight;
      const aspect = viewportWidth / viewportHeight;

      // Ortho zoom
      const zoom = 1.5;

      // Bounds
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;

      // Near/Far
      camera.near = -100;
      camera.far = 100;

      // Set position & look at world center
      camera.position.set(zoom, zoom, zoom);
      camera.lookAt(new THREE.Vector3());

      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ playhead, time }) {
      const t = Math.sin(playhead * Math.PI);
      scene.rotation.z = easeFn(t);
      // eases.expoInOut(t);

      meshes.forEach(mesh => {
        mesh.material.uniforms.time.value = time;
      });
      // controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      // controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
