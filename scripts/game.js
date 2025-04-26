import * as THREE from "three";
import { SceneRenderer } from './renderer.js';
import { PhysicsManager } from './physics.js';
import { SceneObjects } from './objects.js';
import { AnimationManager } from './animation.js';
import { InputManager } from './input.js';
import { DEFAULT_SETTINGS } from './config.js';

/**
 * Основной класс игры, объединяющий все модули
 */
export class Game {
  constructor(containerId, initializedRAPIER = null, userSettings = {}) {
    // Объединяем настройки по умолчанию с пользовательскими
    this.settings = { ...DEFAULT_SETTINGS, ...userSettings };

    // Флаг для отслеживания статуса игры
    this.gameWon = false;

    // Получаем контейнер
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Элемент с id ${containerId} не найден`);
      return;
    }

    // Инициализируем модули
    this.renderer = new SceneRenderer(container);
    this.physics = new PhysicsManager();
    this.animation = new AnimationManager(this.physics, this.settings);

    // Сохраняем ссылки на RAPIER для инициализации
    this.initializedRAPIER = initializedRAPIER;

    // Запускаем инициализацию
    this.init();
  }

  async init() {
    try {
      // Инициализируем физику
      await this.physics.init(this.initializedRAPIER);

      // Создаем объекты на сцене
      this.objects = new SceneObjects(
        this.renderer.scene,
        this.physics,
        this.settings
      );
      this.objects.createAll();

      // Настраиваем обработку ввода
      this.input = new InputManager(
        this.animation,
        this.physics,
        this.objects,
        this.settings
      );

      // Запускаем игровой цикл
      this.animate();

      console.log("Игра успешно инициализирована!");
    } catch (error) {
      console.error("Ошибка при инициализации игры:", error);
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.animation.clock.getDelta();

    // Шаг физической симуляции - только если нет активной анимации переворачивания
    if (!this.animation.isAnimating()) {
      if (this.physics.fallbackPhysicsSimulation && this.objects.cube) {
        // Если используем заглушку - симулируем падение куба
        this.animation.simulateCubeFalling(this.objects.cube, deltaTime);
      } else {
        // Если используем настоящую физику
        this.physics.step();
        this.physics.updatePhysics();
      }

      // Проверяем условие победы после завершения анимации и обновления физики
      this.checkWinCondition();
    }

    // Рендеринг сцены
    this.renderer.render();
  }

  // Проверка условия победы
  checkWinCondition() {
    // Проверяем только если игра еще не выиграна и анимация движения завершена
    if (!this.gameWon && !this.animation.isMoving) {
      if (this.objects.isOnWinTarget()) {
        this.gameWon = true;
        // Показываем сообщение о победе
        setTimeout(() => {
          alert("Вы выиграли!");
        }, 100);

        console.log("Победа! Куб достиг целевой клетки.");
      }
    }
  }

  // Сбросить состояние игры
  resetGame() {
    // Возвращаем куб в начальную позицию
    const { x, z } = this.settings.initialPosition;
    this.setPosition(x, z);
    // Сбрасываем флаг победы
    this.gameWon = false;
    console.log("Игра сброшена");
  }

  // Метод для изменения позиции куба извне
  setPosition(x, z) {
    this.objects.setPosition(x, z);
    console.log(`Куб перемещен на позицию (${x}, ${z})`);
  }
}
