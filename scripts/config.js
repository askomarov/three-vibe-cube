/**
 * Конфигурация приложения
 */

// Настройки по умолчанию
export const DEFAULT_SETTINGS = {
  initialPosition: { x: 0, z: 0 }, // Начальная позиция куба (в координатах сетки)
  cubeColor: 0x00ff00,             // Цвет куба - зеленый
  gridSize: 1,                     // Размер одной клетки
  animationDuration: 300,          // Длительность анимации переворачивания (мс)
  gridOffset: 0.5,                 // Смещение сетки
  winTarget: { x: 3, z: 3 },       // Позиция целевой клетки
  winTargetColor: 0xff0000         // Цвет целевой клетки - красный
};

// Настройки камеры
export const CAMERA_CONFIG = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: { x: 5, y: 5, z: 5 }
};

// Настройки сцены
export const SCENE_CONFIG = {
  backgroundColor: 0x686868
};

// Настройки физики
export const PHYSICS_CONFIG = {
  gravity: { x: 0.0, y: -9.81, z: 0.0 }
};

// Настройки объектов
export const OBJECTS_CONFIG = {
  ground: {
    size: 10,
    color: 0x999999,
    roughness: 0.8
  },
  cube: {
    size: 1,
    roughness: 0.7,
    metalness: 0.2,
    friction: 0.1
  }
};

// Настройки освещения
export const LIGHT_CONFIG = {
  directional: {
    color: 0xffffff,
    intensity: 1.5,
    position: { x: 5, y: 10, z: 7 },
    shadowMapSize: 1024,
    shadowArea: 10
  },
  ambient: {
    color: 0x404040,
    intensity: 0.5
  }
};
