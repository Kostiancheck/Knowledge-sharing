import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import {degToRad} from "three/src/math/MathUtils.js";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.outputEncoding = THREE.sRGBEncoding;

// Light
const light = new THREE.DirectionalLight(0xffffff, 20);
light.position.set(-20, 300, 10);
scene.add(light);

const lightHelper = new THREE.DirectionalLightHelper(light, 10);
scene.add(lightHelper);

const light2 = new THREE.DirectionalLight(0xffffff, 3);
light2.position.set(20, -150, 300);
scene.add(light2);

//
const lightHelper2 = new THREE.DirectionalLightHelper(light2, 10);
scene.add(lightHelper2);

const ambLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambLight);

// Temporary Model (Icosahedron as placeholder for d20)
const cubeGeometry = new THREE.IcosahedronGeometry(200);
const material = new THREE.MeshNormalMaterial({ color: 'blue' });
// const material = new THREE.MeshStandardMaterial({color: 'blue'});
const model = new THREE.Mesh(cubeGeometry, material);
model.material.side = THREE.DoubleSide;
model.rotation.x = degToRad(30);
model.rotation.y = degToRad(-30);
scene.add(model);

// Camera Position
camera.position.set(0, 0, 500);

// Create a TWEEN.Group to manage the animations
const tweenGroup = new TWEEN.Group();

// Create the tween animation for position and rotation
const createRotationTween = () => {
    return new TWEEN.Tween(
        {
            xRotation: model.rotation.x,
            yRotation: model.rotation.y,
            zRotation: model.rotation.z
        }, tweenGroup)
        .to({
            xRotation: model.rotation.x + Math.PI,
            yRotation: model.rotation.y + Math.PI,
            zRotation: model.rotation.z + Math.PI
        }, 5000)
        .onUpdate((coords) => {
            // Update rotation smoothly
            model.rotation.x = coords.xRotation;
            model.rotation.y = coords.yRotation;
            model.rotation.z = coords.zRotation;
        })
        .easing(TWEEN.Easing.Exponential.InOut)
        .onComplete(function () {
            createRotationTween().start();
        })
};

// Start the first tween
createRotationTween().start();

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
