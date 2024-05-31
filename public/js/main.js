// Import the necessary modules using full URLs for the CDN
import { OrbitControls } from "/js/OrbitControls.js";
import * as THREE from "/js/three.module.js";
import Player from "./player.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// Environment setup

// Skybox
const loader = new THREE.CubeTextureLoader();
loader.setPath("/texture/skybox/");
const textureCube = loader.load([
  "px.jpg",
  "nx.jpg",
  "py.jpg",
  "ny.jpg",
  "pz.jpg",
  "nz.jpg",
]);
scene.background = textureCube;

// Plane (Ground)
const planeSize = 100;
const planeThickness = 2;
const grassTextureLoader = new THREE.TextureLoader();
const grassTexture = grassTextureLoader.load("/texture/grass.jpg");
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10, 10);
const planeMaterial = new THREE.MeshLambertMaterial({
  map: grassTexture,
  side: THREE.DoubleSide,
});
const boxGeometry = new THREE.BoxGeometry(
  planeSize,
  planeSize,
  0.5,
  32,
  32,
  32
);
const plane = new THREE.Mesh(boxGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -0.5;
scene.add(plane);

// Local Player setup
const player = new THREE.Group();

// Load face texture
const faceTextureLoader = new THREE.TextureLoader();
const headTexture = faceTextureLoader.load("/texture/face.png");
const textureMaterial = [
  new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }),
  new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }),
  new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }),
  new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }),
  new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }),
  new THREE.MeshLambertMaterial({ map: headTexture, transparent: true }),
];

// Head geometry
const headGeometry = new THREE.BoxGeometry(1, 1, 1);
const faceGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001); // Slightly larger
const headMaterial = new THREE.MeshLambertMaterial({ color: 0xfcd462 });
headTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const head = new THREE.Mesh(headGeometry, headMaterial);
const face = new THREE.Mesh(faceGeometry, textureMaterial);
head.position.set(0, 4.5, 0);
face.position.set(0, 4.5, 0);
player.add(face);
player.add(head);

// Body
const bodyGeometry = new THREE.BoxGeometry(2, 2, 1);
const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3cb371 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.position.set(0, 3, 0);
player.add(body);

// Arms
const armGeometry = new THREE.BoxGeometry(1, 2, 1);
const armMaterial = new THREE.MeshLambertMaterial({ color: 0xfcd462 });
armGeometry.translate(0, -0.5, 0);
const leftArm = new THREE.Mesh(armGeometry, armMaterial);
const rightArm = new THREE.Mesh(armGeometry, armMaterial);
leftArm.position.set(-1.5, 3.5, 0);
rightArm.position.set(1.5, 3.5, 0);
player.add(leftArm);
player.add(rightArm);

// Legs
const legGeometry = new THREE.BoxGeometry(1, 2, 1);
legGeometry.translate(0, -0.5, 0);
const legMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
leftLeg.position.set(-0.5, 1.5, 0);
rightLeg.position.set(0.5, 1.5, 0);
player.add(leftLeg);
player.add(rightLeg);

// Add player to the scene
scene.add(player);

// Camera Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(player.position.x, player.position.y, player.position.z);
controls.update();
controls.enablePan = false;
controls.enableZoom = true;
controls.maxPolarAngle = Math.PI / 2;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.ZOOM,
  RIGHT: THREE.MOUSE.ROTATE,
};
player.position.y = 20;
camera.position.z = 12;

// Physics and Movement variables
let gravity = -200;
let playerVelocityY = 0;
let playerSpeed = 0.1;
let swingSpeed = 12;
let armSwingAmplitude = Math.PI / 8;
let legSwingAmplitude = Math.PI / 4;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isMoving = false;

// Update Player Movement
function updatePlayerMovement(delta) {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  const strafeDirection = new THREE.Vector3();
  camera.getWorldDirection(strafeDirection);
  strafeDirection.cross(camera.up).normalize();

  const currentRotation = { y: player.rotation.y };
  let targetRotation = currentRotation.y;

  let moveX = 0,
    moveZ = 0;
  if (moveForward) moveZ -= playerSpeed;
  if (moveBackward) moveZ += playerSpeed;
  if (moveLeft) moveX += playerSpeed;
  if (moveRight) moveX -= playerSpeed;

  if (moveX !== 0 || moveZ !== 0) {
    let combinedDirection = new THREE.Vector3(moveX, 0, moveZ).normalize();
    combinedDirection.applyQuaternion(camera.quaternion);
    targetRotation = Math.atan2(-combinedDirection.x, -combinedDirection.z);
  }

  const rotationSpeed = 0.05; // Adjust rotation speed as necessary
  let deltaRotation = targetRotation - player.rotation.y;
  deltaRotation = Math.atan2(Math.sin(deltaRotation), Math.cos(deltaRotation));
  player.rotation.y += deltaRotation * rotationSpeed;
  player.rotation.y = (player.rotation.y + Math.PI * 2) % (Math.PI * 2);

  if (moveForward) {
    camera.position.x += direction.x * playerSpeed;
    camera.position.z += direction.z * playerSpeed;

    player.position.x += direction.x * playerSpeed;
    player.position.z += direction.z * playerSpeed;
  }
  if (moveBackward) {
    camera.position.x -= direction.x * playerSpeed;
    camera.position.z -= direction.z * playerSpeed;

    player.position.x -= direction.x * playerSpeed;
    player.position.z -= direction.z * playerSpeed;
  }
  if (moveLeft) {
    camera.position.x += strafeDirection.x * playerSpeed;
    camera.position.z += strafeDirection.z * playerSpeed;

    player.position.x += strafeDirection.x * playerSpeed;
    player.position.z += strafeDirection.z * playerSpeed;
  }
  if (moveRight) {
    camera.position.x -= strafeDirection.x * playerSpeed;
    camera.position.z -= strafeDirection.z * playerSpeed;

    player.position.x -= strafeDirection.x * playerSpeed;
    player.position.z -= strafeDirection.z * playerSpeed;
  }

  // Restrict player movement within the plane boundaries
  if (player.position.x < -(planeSize / 2))
    player.position.x = -(planeSize / 2);
  if (player.position.x > planeSize / 2) player.position.x = planeSize / 2;
  if (player.position.z < -(planeSize / 2))
    player.position.z = -(planeSize / 2);
  if (player.position.z > planeSize / 2) player.position.z = planeSize / 2;

  // Apply gravity to player
  playerVelocityY += gravity * delta;
  player.position.y += playerVelocityY * delta;

  // Collision detection with the plane
  if (player.position.y < 0) {
    player.position.y = 0;
    playerVelocityY = 0;
    canJump = true;
  }
}

// Spawn test players
for (let i = 0; i < 10; i++) {
  new Player(renderer, scene, planeSize);
}

// Animation loop
let clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  let delta = clock.getDelta();
  updatePlayerMovement(delta);

  // Check if character is moving to enable walking animation
  isMoving = moveForward || moveBackward || moveLeft || moveRight;

  // Play player animation
  const targetArmRotation =
    isMoving && canJump
      ? Math.sin(clock.elapsedTime * swingSpeed) * armSwingAmplitude
      : 0;
  const targetLegRotation =
    isMoving && canJump
      ? Math.sin(clock.elapsedTime * swingSpeed) * legSwingAmplitude
      : 0;

  // Lerp arm and leg rotation towards the target rotation
  leftArm.rotation.x = THREE.MathUtils.lerp(
    leftArm.rotation.x,
    targetArmRotation,
    delta * swingSpeed
  );
  rightArm.rotation.x = THREE.MathUtils.lerp(
    rightArm.rotation.x,
    -targetArmRotation,
    delta * swingSpeed
  );
  leftLeg.rotation.x = THREE.MathUtils.lerp(
    leftLeg.rotation.x,
    -targetLegRotation,
    delta * swingSpeed
  );
  rightLeg.rotation.x = THREE.MathUtils.lerp(
    rightLeg.rotation.x,
    targetLegRotation,
    delta * swingSpeed
  );

  // Update camera position to follow the player at a fixed offset
  camera.position.y = player.position.y + 12;
  controls.target.set(
    player.position.x,
    player.position.y + 4.5,
    player.position.z
  );
  controls.update();

  renderer.render(scene, camera);
}
animate();

// Event listeners for key presses
document.addEventListener("keydown", function (event) {
  switch (event.code) {
    case "KeyW":
      moveForward = true;
      break;
    case "KeyA":
      moveRight = true;
      break;
    case "KeyS":
      moveBackward = true;
      break;
    case "KeyD":
      moveLeft = true;
      break;
    case "Space":
      if (canJump) {
        playerVelocityY += 60; // Jump height
        canJump = false;
      }
      break;
  }
});

document.addEventListener("keyup", function (event) {
  switch (event.code) {
    case "KeyW":
      moveForward = false;
      break;
    case "KeyA":
      moveRight = false;
      break;
    case "KeyS":
      moveBackward = false;
      break;
    case "KeyD":
      moveLeft = false;
      break;
  }
});

// Event listener for window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Prevent context menu from appearing on right-click
renderer.domElement.addEventListener("contextmenu", function (event) {
  event.preventDefault();
});
