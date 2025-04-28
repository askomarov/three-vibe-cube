import * as THREE from "three";
import { JoystickController } from "./joystick.js";

/**
 * Класс для обработки пользовательского ввода
 */
export class InputManager {
  constructor(animation, physics, objects, settings) {
    this.animation = animation;
    this.physics = physics;
    this.objects = objects;
    this.settings = settings;

    // Добавляем объект для отслеживания нажатых клавиш и их состояния
    this.keys = {
      ArrowUp: { pressed: false, cooldown: false },
      ArrowDown: { pressed: false, cooldown: false },
      ArrowLeft: { pressed: false, cooldown: false },
      ArrowRight: { pressed: false, cooldown: false }
    };

    // Добавляем контроллер джойстика
    this.joystick = null;

    // Отслеживаем текущее направление джойстика
    this.joystickDirection = null;

    // Флаг для проверки, готов ли куб к следующему движению
    this.readyForNextMove = true;

    // Инициализация обработчиков событий
    this.init();
  }

  init() {
    // Добавляем обработчики нажатия и отпускания клавиш
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));

    // Инициализируем джойстик
    this.initJoystick();

    // Добавляем обработчик события завершения перемещения кубика
    document.addEventListener('cubeMovementComplete', this.handleCubeMovementComplete.bind(this));
  }

  /**
   * Обработчик завершения перемещения кубика
   */
  handleCubeMovementComplete() {
    this.readyForNextMove = true;

    // Если есть активное направление джойстика, сразу инициируем следующее движение
    if (this.joystickDirection) {
      this.processJoystickDirection(this.joystickDirection);
    }
  }

  /**
   * Инициализация виртуального джойстика
   */
  initJoystick() {
    // Создаем джойстик с настройками
    this.joystick = new JoystickController({
      zone: document.getElementById('joystick-zone'),
      color: '#0066ff',
      size: 120,
      lockX: false,
      lockY: false,
      restJoystick: true
    }).init();

    // Устанавливаем обработчик направления движения
    this.joystick.onDirection(direction => {
      this.joystickDirection = direction;

      // Обрабатываем направление джойстика только если куб готов к движению
      if (this.readyForNextMove) {
        this.processJoystickDirection(direction);
      }
    });

    // Устанавливаем обработчик окончания управления джойстиком
    this.joystick.onEnd(() => {
      this.joystickDirection = null;
    });
  }

  /**
   * Обрабатывает направление джойстика и перемещает кубик
   */
  processJoystickDirection(direction) {
    // Преобразуем направление джойстика в соответствующее направление кубика
    let keyDirection;
    switch (direction.angle) {
      case 'up':
        keyDirection = 'ArrowUp';
        break;
      case 'down':
        keyDirection = 'ArrowDown';
        break;
      case 'left':
        keyDirection = 'ArrowLeft';
        break;
      case 'right':
        keyDirection = 'ArrowRight';
        break;
      default:
        return;
    }

    // Перемещаем кубик в указанном направлении
    this.moveCubeOnGrid(keyDirection);
  }

  // Обработчик нажатия клавиши
  handleKeyDown(event) {
    const key = event.code;
    if (this.keys[key] && !this.keys[key].cooldown && !this.animation.isMoving) {
      this.keys[key].pressed = true;
      this.keys[key].cooldown = true;

      // Запланировать сброс кулдауна через небольшое время
      setTimeout(() => {
        this.keys[key].cooldown = false;
      }, 200); // 200мс задержка между нажатиями

      // Перемещаем кубик
      this.moveCubeOnGrid(key);

      // Предотвращаем стандартное поведение браузера для стрелок
      event.preventDefault();
    }
  }

  // Обработчик отпускания клавиши
  handleKeyUp(event) {
    const key = event.code;
    if (this.keys[key]) {
      this.keys[key].pressed = false;
    }
  }

  // Метод перемещения кубика по сетке с анимацией переворачивания
  moveCubeOnGrid(direction) {
    if (this.animation.isMoving) return; // Если кубик уже движется, ничего не делаем

    // Отмечаем, что куб не готов к следующему движению
    this.readyForNextMove = false;

    const cube = this.objects.cube;
    const cubeBody = this.objects.cubeBody;

    if (!cube) return;

    // Текущая позиция кубика
    let currentPosition;

    if (this.physics.fallbackPhysicsSimulation) {
      // Если используем визуальную симуляцию
      currentPosition = cube.position.clone();
    } else {
      // Если используем физику
      const translation = cubeBody.translation();
      currentPosition = new THREE.Vector3(translation.x, translation.y, translation.z);
    }

    // Вычисляем новую позицию на основе направления
    this.animation.targetPosition.copy(currentPosition);

    // Ось вращения и направление движения
    let rotationAxis = new THREE.Vector3();

    switch (direction) {
      case 'ArrowUp':
        this.animation.targetPosition.z -= this.settings.gridSize;
        rotationAxis.set(-1, 0, 0); // вращение вокруг оси -X для верхней грани
        break;
      case 'ArrowDown':
        this.animation.targetPosition.z += this.settings.gridSize;
        rotationAxis.set(1, 0, 0); // вращение вокруг оси X для верхней грани
        break;
      case 'ArrowLeft':
        this.animation.targetPosition.x -= this.settings.gridSize;
        rotationAxis.set(0, 0, 1); // вращение вокруг оси Z для верхней грани
        break;
      case 'ArrowRight':
        this.animation.targetPosition.x += this.settings.gridSize;
        rotationAxis.set(0, 0, -1); // вращение вокруг оси -Z для верхней грани
        break;
      default:
        return;
    }

    // Проверяем границы
    const minBound = -4.5 + this.settings.gridOffset;
    const maxBound = 4.5 + this.settings.gridOffset;

    if (this.animation.targetPosition.x < minBound - 0.01 ||
        this.animation.targetPosition.x > maxBound + 0.01 ||
        this.animation.targetPosition.z < minBound - 0.01 ||
        this.animation.targetPosition.z > maxBound + 0.01) {
      console.log("Выход за пределы поля. Движение отменено.");
      this.readyForNextMove = true; // Сбрасываем флаг, чтобы позволить другое движение
      return; // Выход за пределы поля
    }

    // Проверяем, не пытается ли кубик пройти сквозь препятствие
    const targetX = Math.round(this.animation.targetPosition.x);
    const targetZ = Math.round(this.animation.targetPosition.z);

    // Проверяем, не является ли целевая позиция победной клеткой или начальной позицией
    const isWinTarget = this.settings.winTarget &&
      Math.abs(targetX - this.settings.winTarget.x) < 0.1 &&
      Math.abs(targetZ - this.settings.winTarget.z) < 0.1;

    const isInitialPosition =
      Math.abs(targetX - this.settings.initialPosition.x) < 0.1 &&
      Math.abs(targetZ - this.settings.initialPosition.z) < 0.1;

    // Если это не победная клетка и не начальная позиция, проверяем свободна ли позиция
    if (!isWinTarget && !isInitialPosition && !this.objects.isPositionFree(targetX, targetZ)) {
      console.log("На пути препятствие. Движение отменено.");
      this.readyForNextMove = true; // Сбрасываем флаг, чтобы позволить другое движение
      return; // Позиция занята препятствием
    }

    // Устанавливаем флаг движения
    this.animation.isMoving = true;

    // Вычисляем положение точки опоры для вращения (середина верхнего ребра в направлении движения)
    const pivotPoint = new THREE.Vector3();
    // Размер куба = 1, половина = 0.5
    const halfSize = 0.5;

    // Определяем положение точки опоры в зависимости от направления движения
    // Используем верхнюю грань
    if (direction === 'ArrowUp') {
      pivotPoint.set(currentPosition.x, currentPosition.y + halfSize, currentPosition.z - halfSize);
    } else if (direction === 'ArrowDown') {
      pivotPoint.set(currentPosition.x, currentPosition.y + halfSize, currentPosition.z + halfSize);
    } else if (direction === 'ArrowLeft') {
      pivotPoint.set(currentPosition.x - halfSize, currentPosition.y + halfSize, currentPosition.z);
    } else if (direction === 'ArrowRight') {
      pivotPoint.set(currentPosition.x + halfSize, currentPosition.y + halfSize, currentPosition.z);
    }

    // Запускаем анимацию переворачивания
    this.animation.startRollAnimation(
      cube,
      cubeBody,
      currentPosition,
      this.animation.targetPosition,
      rotationAxis,
      pivotPoint
    );
  }

  /**
   * Освобождение ресурсов при уничтожении
   */
  dispose() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("cubeMovementComplete", this.handleCubeMovementComplete);

    // Уничтожаем джойстик при необходимости
    if (this.joystick) {
      this.joystick.destroy();
      this.joystick = null;
    }
  }
}
