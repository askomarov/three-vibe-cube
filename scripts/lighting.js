import * as THREE from "three";
import { LIGHT_CONFIG } from "./config.js";

/**
 * Класс для управления освещением сцены
 */
export class SceneLighting {
  constructor(scene) {
    this.scene = scene;
    this.lights = {};
  }

  /**
   * Настраивает все освещение сцены
   */
  setupLights() {
    this.addDirectionalLight();
    this.addAmbientLight();
    return this;
  }

  /**
   * Добавляет направленный свет
   */
  addDirectionalLight() {
    const { directional } = LIGHT_CONFIG;

    const directionalLight = new THREE.DirectionalLight(
      directional.color,
      directional.intensity
    );
    directionalLight.position.set(
      directional.position.x,
      directional.position.y,
      directional.position.z
    );
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = directional.shadowMapSize;
    directionalLight.shadow.mapSize.height = directional.shadowMapSize;

    // Настройка области теней
    const d = directional.shadowArea;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    this.scene.add(directionalLight);
    this.lights.directional = directionalLight;

    return directionalLight;
  }

  /**
   * Добавляет рассеянный свет
   */
  addAmbientLight() {
    const { ambient } = LIGHT_CONFIG;

    const ambientLight = new THREE.AmbientLight(
      ambient.color,
      ambient.intensity
    );
    this.scene.add(ambientLight);
    this.lights.ambient = ambientLight;

    return ambientLight;
  }

  /**
   * Получает свет по имени
   * @param {string} name - Имя света (directional, ambient)
   */
  getLight(name) {
    return this.lights[name];
  }

  /**
   * Изменяет интенсивность света
   * @param {string} name - Имя света
   * @param {number} intensity - Интенсивность (0-1)
   */
  setLightIntensity(name, intensity) {
    const light = this.getLight(name);
    if (light) {
      light.intensity = intensity;
    }
  }
}
