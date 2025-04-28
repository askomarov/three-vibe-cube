import * as THREE from "three";
import { OBJECTS_CONFIG } from "./config.js";
import { ObstaclesManager } from "./obstacles.js";
import { SceneLighting } from "./lighting.js";

/**
 * Класс для создания и управления объектами на сцене
 */
export class SceneObjects {
  constructor(scene, physics, settings) {
    this.scene = scene;
    this.physics = physics;
    this.settings = settings;

    this.ground = null;
    this.cube = null;
    this.cubeBody = null;
    this.winTarget = null;

    // Создаем менеджер препятствий
    this.obstaclesManager = new ObstaclesManager(scene, physics, settings);

    // Создаем менеджер освещения
    this.lighting = new SceneLighting(scene);

    this.gridOffset = settings.gridOffset;
  }

  createAll() {
    this.createGround();
    this.createWinTarget();
    this.createCube();
    this.addLight();

    // Добавляем одно препятствие на поле
    this.addObstacle(2, -2);
  }

  /**
   * Добавляет препятствие на указанную позицию
   */
  addObstacle(x, z) {
    return this.obstaclesManager.createObstacle(x, z);
  }

  /**
   * Добавляет препятствие на случайную позицию
   */
  addRandomObstacle() {
    return this.obstaclesManager.addRandomObstacle();
  }

  /**
   * Проверяет, свободна ли позиция (нет препятствий)
   */
  isPositionFree(x, z) {
    return this.obstaclesManager.isPositionFree(x, z);
  }

  createGround() {
    const { size, color, roughness } = OBJECTS_CONFIG.ground;

    // Создаем поверхность
    const groundGeometry = new THREE.PlaneGeometry(size, size);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      roughness
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.position.set(this.gridOffset, 0, this.gridOffset);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Добавляем сетку для визуализации клеток
    const gridHelper = new THREE.GridHelper(size, size);
    gridHelper.position.set(this.gridOffset, 0.01, this.gridOffset);
    this.scene.add(gridHelper);

    // Добавляем вспомогательные метки для отладки
    this.addDebugMarkers();

    // Проверяем, что физика инициализирована
    if (!this.physics.RAPIER || !this.physics.world) {
      console.warn("Физика не инициализирована, пропускаем создание физического объекта");
      return;
    }

    try {
      // Добавляем физику для поверхности с учетом смещения
      const groundRigidBodyDesc = this.physics.RAPIER.RigidBodyDesc.fixed()
        .setTranslation(this.gridOffset, 0, this.gridOffset);
      const groundRigidBody = this.physics.world.createRigidBody(groundRigidBodyDesc);

      // Создаем коллайдер в виде плоскости
      const groundColliderDesc = this.physics.RAPIER.ColliderDesc.cuboid(5, 0.01, 5);
      this.physics.world.createCollider(groundColliderDesc, groundRigidBody);
    } catch (error) {
      console.error("Ошибка при создании физики для поверхности:", error);
    }
  }

  createCube() {
    const { size, roughness, metalness, friction } = OBJECTS_CONFIG.cube;

    // Создаем куб
    const cubeGeometry = new THREE.BoxGeometry(size, size, size);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: this.settings.cubeColor,
      roughness,
      metalness
    });

    // Преобразуем координаты сетки в мировые координаты
    const worldX = this.settings.initialPosition.x;
    const worldZ = this.settings.initialPosition.z;

    this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cube.position.set(worldX, 0.5, worldZ); // Стартовая позиция - на поверхности
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.scene.add(this.cube);

    // Проверяем, что физика инициализирована
    if (!this.physics.RAPIER || !this.physics.world) {
      console.warn("Физика не инициализирована, пропускаем создание физического объекта для куба");
      return;
    }

    try {
      // Добавляем физику для куба
      const cubeRigidBodyDesc = this.physics.RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(worldX, 0.5, worldZ);
      const cubeRigidBody = this.physics.world.createRigidBody(cubeRigidBodyDesc);

      // Сохраняем ссылку на физическое тело куба
      this.cubeBody = cubeRigidBody;

      // Создаем коллайдер для куба
      const cubeColliderDesc = this.physics.RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
      cubeColliderDesc.setFriction(friction);
      this.physics.world.createCollider(cubeColliderDesc, cubeRigidBody);

      // Сохраняем связь между mesh и rigid body
      this.physics.addRigidBody(this.cube, cubeRigidBody);
    } catch (error) {
      console.error("Ошибка при создании физики для куба:", error);
    }
  }

  /**
   * Настраивает освещение сцены
   */
  addLight() {
    // Используем менеджер освещения вместо прямого добавления света
    this.lighting.setupLights();
  }

  addDebugMarkers() {
    // Создаем маркеры на углах поля для проверки корректности границ
    const markerSize = 0.1;
    const markerGeo = new THREE.SphereGeometry(markerSize);

    // Минимальная граница (-4.5, -4.5) с учетом смещения
    const minX = -4.5 + this.gridOffset;
    const minZ = -4.5 + this.gridOffset;

    // Максимальная граница (4.5, 4.5) с учетом смещения
    const maxX = 4.5 + this.gridOffset;
    const maxZ = 4.5 + this.gridOffset;

    // Создаем маркеры по углам поля
    const markers = [
      { pos: [minX, 0.5, minZ], color: 0xff0000 },  // Красный - нижний левый
      { pos: [maxX, 0.5, minZ], color: 0x00ff00 },  // Зеленый - нижний правый
      { pos: [minX, 0.5, maxZ], color: 0x0000ff },  // Синий - верхний левый
      { pos: [maxX, 0.5, maxZ], color: 0xffff00 }   // Желтый - верхний правый
    ];

    markers.forEach(marker => {
      const markerObj = new THREE.Mesh(
        markerGeo,
        new THREE.MeshBasicMaterial({ color: marker.color })
      );
      markerObj.position.set(...marker.pos);
      this.scene.add(markerObj);
    });

    // Выводим координаты углов в консоль для отладки
    console.log(`Границы поля: [${minX}, ${minZ}] - [${maxX}, ${maxZ}]`);
  }

  createWinTarget() {
    if (!this.settings.winTarget) return;

    const { x, z } = this.settings.winTarget;
    const size = 1; // Размер клетки
    const color = this.settings.winTargetColor || 0xff0000; // Красный цвет по умолчанию

    // Создаем материал для целевой клетки
    const targetMaterial = new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    });

    // Создаем геометрию для целевой клетки (немного выше, чтобы избежать z-fighting)
    const targetGeometry = new THREE.PlaneGeometry(size, size);
    this.winTarget = new THREE.Mesh(targetGeometry, targetMaterial);

    // Позиционируем клетку на поле
    // Теперь используем точные координаты сетки для правильного позиционирования
    this.winTarget.rotation.x = -Math.PI / 2;
    this.winTarget.position.set(
      x,  // Используем исходные координаты без смещения
      0.01, // Немного выше земли для избежания z-fighting
      z
    );

    // Добавляем целевую клетку на сцену
    this.scene.add(this.winTarget);

    console.log(`Целевая клетка создана на позиции (${x}, ${z})`);
  }

  // Проверка, находится ли куб на целевой клетке
  isOnWinTarget() {
    if (!this.cube || !this.settings.winTarget) return false;

    // Получаем позицию куба
    const cubePos = this.cube.position;
    const { x, z } = this.settings.winTarget;

    // Логируем для отладки текущие позиции
    console.log(`Проверка победы: куб (${cubePos.x.toFixed(2)}, ${cubePos.z.toFixed(2)}), цель (${x}, ${z})`);

    // Проверяем совпадение позиций (с небольшой погрешностью)
    const tolerance = 0.2;
    return (
      Math.abs(cubePos.x - x) < tolerance &&
      Math.abs(cubePos.z - z) < tolerance
    );
  }

  setPosition(x, z) {
    if (this.physics.fallbackPhysicsSimulation) {
      // Визуальная симуляция
      this.cube.position.set(x, 0.5, z);
    } else {
      // Физическая симуляция
      this.cubeBody.setTranslation({ x, y: 0.5, z }, true);
      this.cubeBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      this.cubeBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    // Проверяем, не находится ли куб на целевой клетке после установки позиции
    if (this.isOnWinTarget()) {
      console.log("Куб установлен на целевую клетку!");
    }
  }
}
