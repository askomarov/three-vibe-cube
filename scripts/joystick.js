import nipplejs from "nipplejs";

/**
 * Класс для управления виртуальным джойстиком
 */
export class JoystickController {
  constructor(options = {}) {
    this.options = {
      zone: document.getElementById('joystick-zone'),
      mode: 'static',
      position: { left: '50%', bottom: '50%' },
      color: '#0066ff',
      size: 120,
      restJoystick: true,
      ...options
    };

    this.joystick = null;
    this.events = {
      move: null,
      dir: null,
      end: null
    };
    this.currentDirection = null;
  }

  /**
   * Инициализация джойстика
   * @returns {JoystickController} this - для цепочки вызовов
   */
  init() {
    if (!this.options.zone) {
      console.error('Не найдена зона для джойстика');
      return this;
    }

    // Создаем менеджер для джойстиков
    this.manager = nipplejs.create(this.options);

    // Получаем первый джойстик для удобства доступа
    this.joystick = this.manager.get(0);

    // Устанавливаем обработчики событий
    this._bindEvents();

    console.log('Джойстик успешно инициализирован');
    return this;
  }

  /**
   * Привязка обработчиков событий джойстика
   * @private
   */
  _bindEvents() {
    // Обработка направлений
    this.manager.on('dir', (evt, data) => {
      const newDirection = data.direction;

      // Вызываем обработчик при изменении направления
      if (this.events.dir && this.currentDirection !== newDirection.angle) {
        this.currentDirection = newDirection.angle;
        this.events.dir(newDirection);
      }
    });

    // Обработка перемещения
    this.manager.on('move', (evt, data) => {
      if (this.events.move) {
        // Нормализуем данные для удобства использования
        const moveData = {
          angle: data.angle.radian,
          force: data.force,
          vector: {
            x: Math.cos(data.angle.radian) * data.force,
            y: Math.sin(data.angle.radian) * data.force
          }
        };
        this.events.move(moveData);
      }
    });

    // Обработка окончания взаимодействия
    this.manager.on('end', (evt, data) => {
      this.currentDirection = null; // Сбрасываем текущее направление
      if (this.events.end) {
        this.events.end();
      }
    });
  }

  /**
   * Установка обработчика для направления движения
   * @param {Function} callback - Функция обратного вызова с направлением
   */
  onDirection(callback) {
    this.events.dir = callback;
    return this;
  }

  /**
   * Установка обработчика для перемещения джойстика
   * @param {Function} callback - Функция обратного вызова с данными о перемещении
   */
  onMove(callback) {
    this.events.move = callback;
    return this;
  }

  /**
   * Установка обработчика для окончания взаимодействия с джойстиком
   * @param {Function} callback - Функция обратного вызова
   */
  onEnd(callback) {
    this.events.end = callback;
    return this;
  }

  /**
   * Получает текущий джойстик
   * @returns {Object} Экземпляр джойстика
   */
  getJoystick() {
    return this.joystick;
  }

  /**
   * Уничтожение джойстика и освобождение ресурсов
   */
  destroy() {
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
      this.joystick = null;
      console.log('Джойстик уничтожен');
    }
  }
}
