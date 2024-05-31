import * as THREE from "/js/three.module.js";

class Player {
  constructor(renderer, scene, planeSize) {
    this.scene = scene;
    this.renderer = renderer;
    this.planeSize = planeSize;

    // Initialize player properties
    this.initPlayer();

    // Create and add player elements (head, body, arms, legs)
    this.createPlayerElements();

    // Add the player to the scene
    this.scene.add(this.player);

    // Initialize gravity and player velocity
    this.initPhysics();

    // Initialize player animation variables
    this.initAnimation();

    // Start the animation loop
    this.animate();
  }

  initPlayer() {
    // Respawn at a random position within the plane
    this.x =
      Math.floor(Math.random() * (this.planeSize + 1)) - this.planeSize / 2;
    this.y =
      Math.floor(Math.random() * (this.planeSize + 1)) - this.planeSize / 2;

    // Create the player group
    this.player = new THREE.Group();
    this.player.position.y = 20;

    // Initialize player movement variables
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = false;
  }

  createPlayerElements() {
    // Group the character parts into one object for easy movement

    // Load face texture
    const faceTextureLoader = new THREE.TextureLoader();
    const headTexture = faceTextureLoader.load("/texture/face.png");

    const textureMaterial = [
      new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }), // Material for side faces
      new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }), // Material for another side
      new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }), // Repeat as necessary
      new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }), // ...
      new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }), // Material for top and bottom faces
      new THREE.MeshLambertMaterial({ map: headTexture, transparent: true }), // Material for the front face
    ];

    // Head geometry
    const headGeometry = new THREE.BoxGeometry(1, 1, 1);
    const faceGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001); // Slightly larger

    // Create materials for each face
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xfcd462 }); // Material for top and bottom faces

    // Ensure that the texture's transparent areas render correctly
    headTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // Create a mesh with the materials array
    const head = new THREE.Mesh(headGeometry, headMaterial);
    const face = new THREE.Mesh(faceGeometry, textureMaterial); // Use the red material

    // Set head position
    head.position.set(this.x + 0, 4.5, this.y + 0);
    face.position.set(this.x + 0, 4.5, this.y + 0);

    // Add head to player
    this.player.add(face);
    this.player.add(head);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(2, 2, 1);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3cb371 }); // Greenish color for body
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(this.x + 0, 3, this.y + 0);
    this.player.add(body);

    // Arms
    const armGeometry = new THREE.BoxGeometry(1, 2, 1);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xfcd462 }); // Same color as head for arms
    armGeometry.translate(0, -0.5, 0);
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(this.x - 1.5, 3.5, this.y + 0);
    this.rightArm.position.set(this.x + 1.5, 3.5, this.y + 0);
    this.player.add(this.leftArm);
    this.player.add(this.rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(1, 2, 1);
    legGeometry.translate(0, -0.5, 0);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff }); // Blueish color for legs
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(this.x - 0.5, 1.5, this.y + 0);
    this.rightLeg.position.set(this.x + 0.5, 1.5, this.y + 0);
    this.player.add(this.leftLeg);
    this.player.add(this.rightLeg);
  }

  // Initialize physics-related properties
  initPhysics() {
    // Initialize gravity and player velocity
    this.gravity = -200;
    this.playerVelocityY = 0;
  }

  // Initialize player animation variables
  initAnimation() {
    this.clock = new THREE.Clock();

    // Initialize player speed and rotation variables
    this.playerSpeed = 0.1;
    this.isMoving = false;
    this.swingSpeed = 12;
    this.armSwingAmplitude = Math.PI / 8;
    this.legSwingAmplitude = Math.PI / 4;
  }

  updatePlayerMovement(delta) {
    // Apply gravity to player and camera
    this.playerVelocityY += this.gravity * delta;
    this.player.position.y += this.playerVelocityY * delta;

    // Play player animation
    const targetArmRotation =
      Math.sin(this.clock.elapsedTime * this.swingSpeed) *
      this.armSwingAmplitude;
    const targetLegRotation =
      Math.sin(this.clock.elapsedTime * this.swingSpeed) *
      this.legSwingAmplitude;

    // Lerp arm and leg rotation towards the target rotation
    this.leftArm.rotation.x = THREE.MathUtils.lerp(
      this.leftArm.rotation.x,
      targetArmRotation,
      delta * this.swingSpeed
    );
    this.rightArm.rotation.x = THREE.MathUtils.lerp(
      this.rightArm.rotation.x,
      -targetArmRotation,
      delta * this.swingSpeed
    );
    this.leftLeg.rotation.x = THREE.MathUtils.lerp(
      this.leftLeg.rotation.x,
      -targetLegRotation,
      delta * this.swingSpeed
    );
    this.rightLeg.rotation.x = THREE.MathUtils.lerp(
      this.rightLeg.rotation.x,
      targetLegRotation,
      delta * this.swingSpeed
    );

    // Collision detection with the plane
    if (this.player.position.y < 0) {
      this.player.position.y = 0;
      this.playerVelocityY = 0;
      this.canJump = true;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.updatePlayerMovement(delta);
  }
}

export default Player;
