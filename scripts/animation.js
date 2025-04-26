import * as THREE from "three";

/**
 * Класс для управления анимациями
 */
export class AnimationManager {
  constructor(physics, settings) {
    this.physics = physics;
    this.settings = settings;
    this.clock = new THREE.Clock();
    this.fallTime = 0;

    this.isMoving = false;
    this.targetPosition = new THREE.Vector3();

    // Параметры анимации переворачивания
    this.rollAnimation = {
      active: false,
      startTime: 0,
      duration: settings.animationDuration || 300,
      startRotation: new THREE.Quaternion(),
      endRotation: new THREE.Quaternion(),
      rotationAxis: new THREE.Vector3(),
      pivotPoint: new THREE.Vector3()
    };
  }

  // Визуальная симуляция падения куба без физики
  simulateCubeFalling(cube, deltaTime) {
    if (!cube || this.rollAnimation.active) return;

    // Простая симуляция гравитации - сразу устанавливаем кубик на пол
    if (cube.position.y > 0.5) {
      cube.position.y = 0.5;  // 0.5 - половина высоты куба, чтобы был ровно на земле
      this.fallTime = 0;
    }
  }

  // Начинаем анимацию переворачивания
  startRollAnimation(cube, cubeBody, startPos, endPos, rotationAxis, pivotPoint) {
    const usePhysics = !this.physics.fallbackPhysicsSimulation && cubeBody;

    // Настраиваем параметры анимации
    this.rollAnimation.active = true;
    this.rollAnimation.startTime = performance.now();
    this.rollAnimation.startRotation.copy(cube.quaternion);
    this.rollAnimation.rotationAxis = rotationAxis;
    this.rollAnimation.pivotPoint = pivotPoint;
    this.rollAnimation.usePhysics = usePhysics;
    this.rollAnimation.cube = cube;
    this.rollAnimation.cubeBody = cubeBody;

    // Вычисляем конечную ротацию (90 градусов вокруг заданной оси)
    const endRotation = new THREE.Quaternion();
    const angle = Math.PI / 2; // 90 градусов
    endRotation.setFromAxisAngle(rotationAxis, angle);

    // Комбинируем с текущей ротацией куба
    this.rollAnimation.endRotation = new THREE.Quaternion().multiplyQuaternions(
      endRotation,
      this.rollAnimation.startRotation
    );

    // Запоминаем начальную и целевую позиции
    this.rollAnimation.startPos = startPos.clone();
    this.rollAnimation.endPos = endPos.clone();

    if (usePhysics) {
      // Отключаем физику на время анимации
      try {
        cubeBody.setBodyType(this.physics.RAPIER.RigidBodyType.KinematicPositionBased, true);
      } catch (error) {
        console.warn("Не удалось изменить тип физического тела:", error);
      }
    }

    // Запускаем анимацию в следующем кадре
    requestAnimationFrame(this.updateRollAnimation.bind(this));
  }

  // Обновление анимации переворачивания на каждом кадре
  updateRollAnimation(currentTime) {
    if (!this.rollAnimation.active) return;

    const { cube, cubeBody, startPos, endPos, startRotation, endRotation, usePhysics } = this.rollAnimation;

    // Вычисляем прогресс анимации
    const elapsed = currentTime - this.rollAnimation.startTime;
    let progress = Math.min(elapsed / this.rollAnimation.duration, 1);

    // Используем плавную функцию для анимации
    progress = this.easeInOutQuad(progress);

    // Плавное вращение между начальной и конечной ротацией
    const currentRotation = new THREE.Quaternion();
    currentRotation.slerpQuaternions(startRotation, endRotation, progress);

    // Применяем вращение
    if (usePhysics && cubeBody) {
      // Для физики
      try {
        cubeBody.setRotation({
          x: currentRotation.x,
          y: currentRotation.y,
          z: currentRotation.z,
          w: currentRotation.w
        }, true);
      } catch (error) {
        console.warn("Не удалось установить вращение для физического тела:", error);
      }
    }

    cube.quaternion.copy(currentRotation);

    // Вычисляем текущую позицию с учетом дуги переворачивания
    const currentPos = new THREE.Vector3();

    // Линейная интерполяция для простого движения вдоль прямой
    currentPos.lerpVectors(startPos, endPos, progress);

    // Для вращения вокруг верхней грани мы модифицируем траекторию
    // В начале и конце анимации высота должна быть такой же, как и целевая позиция
    // В середине анимации высота должна быть выше
    const yOffset = Math.sin(progress * Math.PI) * 0.0; // Убираем дугу по вертикали, движение будет по прямой
    currentPos.y = startPos.y + yOffset;

    // Применяем позицию
    if (usePhysics && cubeBody) {
      // Для физики
      try {
        cubeBody.setTranslation({
          x: currentPos.x,
          y: currentPos.y,
          z: currentPos.z
        }, true);
      } catch (error) {
        console.warn("Не удалось установить позицию для физического тела:", error);
      }
    }

    cube.position.copy(currentPos);

    if (progress < 1) {
      // Продолжаем анимацию
      requestAnimationFrame(this.updateRollAnimation.bind(this));
    } else {
      // Завершаем анимацию
      this.finishRollAnimation();
    }
  }

  // Завершение анимации переворачивания
  finishRollAnimation() {
    const { cube, cubeBody, endPos, usePhysics } = this.rollAnimation;

    this.rollAnimation.active = false;

    // Убеждаемся, что куб находится точно в целевой точке
    cube.position.copy(endPos);

    if (usePhysics && cubeBody) {
      try {
        // Возвращаем динамический тип тела для физики
        cubeBody.setTranslation({
          x: endPos.x,
          y: endPos.y,
          z: endPos.z
        }, true);

        // Возвращаем физику
        cubeBody.setBodyType(this.physics.RAPIER.RigidBodyType.Dynamic, true);
      } catch (error) {
        console.warn("Ошибка при завершении анимации:", error);
      }
    }

    // Снимаем флаг движения
    this.isMoving = false;

    // Генерируем событие завершения движения для проверки целевой клетки
    const event = new CustomEvent('cubeMovementComplete');
    document.dispatchEvent(event);
  }

  // Функция плавности анимации
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // Проверка, идет ли анимация
  isAnimating() {
    return this.rollAnimation.active;
  }
}
