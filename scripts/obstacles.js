import * as THREE from "three";

/**
 * Класс для управления препятствиями на игровом поле
 */
export class ObstaclesManager {
  constructor(scene, physics, settings) {
    this.scene = scene;
    this.physics = physics;
    this.settings = settings;
    this.obstacles = [];
  }

  /**
   * Проверяет, свободна ли заданная позиция
   * @param {number} x - Координата X
   * @param {number} z - Координата Z
   * @returns {boolean} - true если позиция свободна, false если занята
   */
  isPositionFree(x, z) {
    // Не проверяем начальную позицию - игровой кубик может на неё вернуться
    // Убираем эту проверку:
    // const { initialPosition } = this.settings;
    // if (Math.abs(x - initialPosition.x) < 0.1 && Math.abs(z - initialPosition.z) < 0.1) {
    //   return false;
    // }

    // Также не проверяем совпадение с целевой клеткой - на неё можно наступать

    // Проверяем совпадение только с существующими препятствиями
    for (const obstacle of this.obstacles) {
      const position = obstacle.position;
      if (Math.abs(x - position.x) < 0.1 && Math.abs(z - position.z) < 0.1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Создает препятствие на указанной позиции
   */
  createObstacle(x, z) {
    // Проверяем, свободна ли позиция
    if (!this.isPositionFree(x, z)) {
      console.warn(`Позиция (${x}, ${z}) уже занята, не могу добавить препятствие`);
      return null;
    }

    const size = 1;
    const obstacleGeometry = new THREE.BoxGeometry(size, size, size);

    // Создаем материал для препятствия (темно-серый с небольшой прозрачностью)
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9
    });

    // Создаем меш и устанавливаем его позицию
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(x, 0.5, z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;

    // Добавляем меш на сцену
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);

    // Создаем визуальный каркас для препятствия
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true
    });
    const wireframe = new THREE.Mesh(obstacleGeometry, wireframeMaterial);
    wireframe.scale.setScalar(1.01); // Чуть больше основного меша
    obstacle.add(wireframe);

    // Добавляем физику для препятствия
    this.addObstaclePhysics(obstacle, x, z);

    console.log(`Добавлено препятствие на позиции (${x}, ${z})`);
    return obstacle;
  }

  /**
   * Добавляет физические свойства для препятствия
   */
  addObstaclePhysics(obstacle, x, z) {
    // Проверяем, инициализирована ли физика
    if (!this.physics.RAPIER || !this.physics.world) {
      console.warn("Физика не инициализирована, пропускаем создание физики для препятствия");
      return;
    }

    try {
      // Создаем неподвижное физическое тело для препятствия
      const rigidBodyDesc = this.physics.RAPIER.RigidBodyDesc.fixed()
        .setTranslation(x, 0.5, z);
      const rigidBody = this.physics.world.createRigidBody(rigidBodyDesc);

      // Создаем коллайдер в форме куба
      const colliderDesc = this.physics.RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
      this.physics.world.createCollider(colliderDesc, rigidBody);

      // Связываем физическое тело с мешем
      this.physics.addRigidBody(obstacle, rigidBody);
    } catch (error) {
      console.error("Ошибка при создании физики для препятствия:", error);
    }
  }

  /**
   * Добавляет препятствие на случайную свободную позицию
   */
  addRandomObstacle() {
    // Определяем границы поля
    const minBound = -4;
    const maxBound = 4;

    // Пытаемся найти свободную позицию для препятствия (до 10 попыток)
    let attempts = 0;
    let x, z;
    do {
      // Генерируем случайные целые координаты в пределах поля
      x = Math.floor(Math.random() * (maxBound - minBound + 1)) + minBound;
      z = Math.floor(Math.random() * (maxBound - minBound + 1)) + minBound;
      attempts++;
    } while (!this.isPositionFree(x, z) && attempts < 10);

    // Если нашли свободное место, создаем там препятствие
    if (this.isPositionFree(x, z)) {
      return this.createObstacle(x, z);
    } else {
      console.warn("Не удалось найти свободное место для препятствия");
      return null;
    }
  }
}
