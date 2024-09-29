import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.outputEncoding = THREE.sRGBEncoding;

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
    scene.add(model);
}, undefined, (error) => {
    console.error('An error occurred loading the model:', error);
});

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


// Using quaternions
// const createRotationTween = () => {
//     const startQuat = model.quaternion.clone(); // Clone current rotation as quaternion
//
//     // Create a target quaternion representing 180-degree (PI) rotation on each axis
//     const endQuat = new THREE.Quaternion().setFromEuler(
//         new THREE.Euler(
//             model.rotation.x + Math.PI * 2.5,  // Rotate by 180 degrees on x-axis
//             model.rotation.y + Math.PI * 2.5,  // Rotate by 180 degrees on y-axis
//             model.rotation.z + Math.PI * 2.5   // Rotate by 180 degrees on z-axis
//         )
//     );
//
//     return new TWEEN.Tween({ t: 0 }, tweenGroup) // Interpolating a scalar 't' from 0 to 1
//         .to({ t: 1 }, 5000)  // Duration of 5000ms
//         .onUpdate(({ t }) => {
//             // Spherical Linear Interpolation (SLERP) between start and end quaternions
//             model.quaternion.slerp(endQuat, t);
//         })
//         .easing(TWEEN.Easing.Exponential.InOut)
//         .onComplete(() => {
//             // After the tween completes, create another rotation to repeat the cycle
//             createRotationTween().start();
//         });
// };

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
