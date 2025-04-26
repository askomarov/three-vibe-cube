import "./style.css";
import { Game } from "./scripts/game.js";
import RAPIER from "@dimforge/rapier3d-compat";

// Настройки для приложения
const appSettings = {
  initialPosition: { x: 0, z: 0 },  // Начальная позиция куба (в координатах сетки)
  cubeColor: 0x00ff00,               // Зеленый цвет для куба
  winTarget: { x: 3, z: 3 },         // Позиция целевой клетки
  winTargetColor: 0xff0000           // Цвет целевой клетки - красный
};

// Сначала инициализируем RAPIER, а затем запускаем нашу сцену
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Инициализируем RAPIER глобально перед созданием игры
    console.log("Начинаем инициализацию RAPIER...");
    await RAPIER.init();
    console.log("RAPIER успешно инициализирован");

    // Создаем экземпляр Game с нашей сценой, передавая инициализированный RAPIER и настройки
    const game = new Game('canvas', RAPIER, appSettings);

    // Добавляем возможность изменения позиции и сброса игры через глобальный объект
    window.gameApp = {
      setPosition: (x, z) => game.setPosition(x, z),
      resetGame: () => game.resetGame()
    };
  } catch (error) {
    console.error("Ошибка при инициализации RAPIER:", error);

    // Даже в случае ошибки создаем Game без физики, но с настройками
    console.log("Запуск игры без физики...");
    const game = new Game('canvas', null, appSettings);

    window.gameApp = {
      setPosition: (x, z) => game.setPosition(x, z),
      resetGame: () => game.resetGame()
    };
  }
});
