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
light.position.set(-100, 300, 300);
scene.add(light);

const light2 = new THREE.DirectionalLight(0xffffff, 20);
light2.position.set(300, -300, 200);
scene.add(light2);

const light3 = new THREE.DirectionalLight(0xffffff, 20);
light3.position.set(-300, -300, 200);
scene.add(light3);

// const lightHelper = new THREE.DirectionalLightHelper(light, 10);
// scene.add(lightHelper);
// const lightHelper2 = new THREE.DirectionalLightHelper(light2, 10);
// scene.add(lightHelper2);

// const ambLight = new THREE.AmbientLight(0xffffff, 0.1);
// scene.add(ambLight);

let model = new THREE.Object3D();
const loader = new GLTFLoader();
loader.load('d20_dice_w20_wurfel_3d_model_free/scene.gltf', (gltf) => {
    model = gltf.scene;
    // model.rotateX(degToRad(30));
    // model.rotateZ(degToRad(180));
    console.log(model.rotation.x)
    model.rotateOnWorldAxis(oX, degToRad(45))
    model.rotateOnWorldAxis(oZ, degToRad(180))
    console.log(model.rotation.x)
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

console.log()
// Load background
const backLoader = new THREE.TextureLoader();
backLoader.load('random_back.jpg', function (texture) {
    scene.background = texture; // Set the texture as the scene's background
});

// Camera Position
camera.position.set(0, 0, 500);

// Create a TWEEN.Group to manage the animations
// const tweenGroup = new TWEEN.Group();

// Create the tween animation for position and rotation
// const createRotationTween = () => {
//     return new TWEEN.Tween(model, tweenGroup)
//         .onUpdate((coords) => {
//             // Update rotation smoothly
//             model.rotateOnWorldAxis(oX, degToRad(180));
//             model.rotateOnWorldAxis(oY, degToRad(180));
//             model.rotateOnWorldAxis(oZ, degToRad(180));
//         })
//         .easing(TWEEN.Easing.Sinusoidal.InOut)
// };


// Start the first tween
// createRotationTween().start();


function xRotation(t) {
    return degToRad(2)
}

function yRotation(t) {
    return degToRad(4 * Math.cos(t/2000+200))
}

function zRotation(t) {
    return degToRad(2 * Math.sin(t/2000))
}

// Animation Loop
const animate = (t) => {
    let id = requestAnimationFrame(animate);
    // Update the tween group instead of using the deprecated TWEEN.update()
    if (t > 10000){
        cancelAnimationFrame(id)
    }

    model.rotateOnWorldAxis(oX, xRotation(t));
    console.log("X =" + model.rotation.x)
    model.rotateOnWorldAxis(oY, yRotation(t));
    console.log("Y =" + model.rotation.y)
    model.rotateOnWorldAxis(oZ, zRotation(t));
    console.log("Z =" + model.rotation.z)
    // console.log(Math.sin(t))

    // model.rotation.x += degToRad(1);
    // model.rotation.y += degToRad(1);
    // model.rotation.z += degToRad(1);
    renderer.render(scene, camera);
}
animate(0);

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
