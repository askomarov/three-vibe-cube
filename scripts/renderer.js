import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CAMERA_CONFIG, SCENE_CONFIG } from "./config.js";

/**
 * Класс для управления рендерингом и сценой
 */
export class SceneRenderer {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.addOrbitControls();

    // Настройка обработчика изменения размеров окна
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_CONFIG.backgroundColor);
    return scene;
  }

  createCamera() {
    const { fov, near, far, position } = CAMERA_CONFIG;
    const aspect = this.width / this.height;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(position.x, position.y, position.z);
    return camera;
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(this.width, this.height);
    renderer.shadowMap.enabled = true;

    if (this.container) {
      this.container.appendChild(renderer.domElement);
    } else {
      console.error("Элемент контейнера не найден.");
    }

    return renderer;
  }

  addOrbitControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    return controls;
  }

  onWindowResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
