import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import {degToRad} from "three/src/math/MathUtils.js";
import {Vector3} from "three";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.outputEncoding = THREE.sRGBEncoding;

//
const oX = new Vector3(1, 0, 0)
const oY = new Vector3(0, 1, 0)
const oZ = new Vector3(0, 0, 1)

// Light
const light = new THREE.DirectionalLight(0xffffff, 100);
light.position.set(-20, 300, 10);
scene.add(light);

const light2 = new THREE.DirectionalLight(0xffffff, 20);
light2.position.set(20, -300, 200);
scene.add(light2);

const ambLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambLight);

let model = new THREE.Object3D();
const loader = new GLTFLoader();
loader.load('d20_dice_w20_wurfel_3d_model_free/scene.gltf', (gltf) => {
    model = gltf.scene;
    // model.rotateX(degToRad(30));
    // model.rotateZ(degToRad(180));
    model.rotateOnWorldAxis(oX, degToRad(45))
    model.rotateOnWorldAxis(oZ, degToRad(180))
    // // model.rotation.x = 0.3
    scene.add(model);
}, undefined, (error) => {
    console.error('An error occurred loading the model:', error);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // for smooth controls
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 5000;

// Load background
const backLoader = new THREE.TextureLoader();
backLoader.load('random_back.jpg', function (texture) {
    scene.background = texture; // Set the texture as the scene's background
});

// Camera Position
camera.position.set(0, 0, 500);

// Create a TWEEN.Group to manage the animations
const tweenGroup = new TWEEN.Group();

// Create the tween animation for position and rotation
// const createRotationTween = () => {
//     return new TWEEN.Tween(
//         {
//             xRotation: model.rotation.x,
//             yRotation: model.rotation.y,
//             zRotation: model.rotation.z
//         }, tweenGroup)
//         .to({
//             xRotation: model.rotation.x + Math.PI * 7,
//             yRotation: model.rotation.y + Math.PI * 7,
//             zRotation: model.rotation.z + Math.PI * 7
//         }, 10000)
//         .onUpdate((coords) => {
//             // Update rotation smoothly
//             model.rotation.x = coords.xRotation;
//             model.rotation.y = coords.yRotation;
//             model.rotation.z = coords.zRotation;
//         })
//         .easing(TWEEN.Easing.Sinusoidal.InOut)
//         .onComplete(function () {
//             createRotationTween().start();
//         })
// };
//
//
// // Start the first tween
// createRotationTween().start();

// Animation Loop
const animate = () => {
    requestAnimationFrame(animate);
    // Update the tween group instead of using the deprecated TWEEN.update()
    tweenGroup.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
