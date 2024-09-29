// to do
// 1. simple scene, camera, etc
// 2. orbital rotation
// 3. light helper

import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Set the camera position
camera.position.set(0, 0, 500);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.DirectionalLight(0xffffff, 20);
light.position.set(-50, 100, 100);
light.castShadow = true;
scene.add(light);

// Optional: Add a helper to visualize the direction of the light
const lightHelper = new THREE.DirectionalLightHelper(light, 10);
scene.add(lightHelper);

// Geometry
const cubeGeometry = new THREE.BoxGeometry(200, 200, 200)
const material = new THREE.MeshStandardMaterial({color: 'indigo'})
const cube = new THREE.Mesh(cubeGeometry, material)
cube.rotation.x = 2;
cube.rotation.y = 4;
scene.add(cube)


// // Create controls to manipulate the model
// const controls = new OrbitControls(camera, renderer.domElement);
// // const controls = new OrbitControls(cube, renderer.domElement);
// controls.enableDamping = true; // for smooth controls
// controls.dampingFactor = 0.05;
// controls.screenSpacePanning = false;
// controls.minDistance = 1;
// controls.maxDistance = 5000;

// Animate function
function animate() {
    requestAnimationFrame(animate);
    // controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});