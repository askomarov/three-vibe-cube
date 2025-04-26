import { PHYSICS_CONFIG } from "./config.js";

/**
 * Класс для управления физикой
 */
export class PhysicsManager {
  constructor() {
    this.world = null;
    this.RAPIER = null;
    this.rigidBodies = [];
    this.fallbackPhysicsSimulation = false;
  }

  async init(initializedRAPier = null) {
    if (initializedRAPier) {
      this.RAPIER = initializedRAPier;
    } else {
      await this.initRapier();
    }

    if (this.RAPIER && this.RAPIER.World) {
      const { gravity } = PHYSICS_CONFIG;
      this.world = new this.RAPIER.World(gravity);
      console.log("Physics initialized successfully");
      return true;
    }

    return false;
  }

  async initRapier() {
    try {
      console.log("Начинаем инициализацию RAPIER...");
      const RAPIER = await import("@dimforge/rapier3d-compat");
      this.RAPIER = await RAPIER.default.init();
    } catch (error) {
      console.error("Ошибка при импорте RAPIER:", error);
      this.createFallbackPhysics();
    }
  }

  createFallbackPhysics() {
    console.log("Создаем заглушку для физики - визуальная симуляция");

    // Создаем заглушки для физических объектов
    this.RAPIER = {
      RigidBodyDesc: {
        fixed: () => ({}),
        dynamic: () => ({
          setTranslation: () => ({})
        })
      },
      ColliderDesc: {
        cuboid: () => ({})
      },
      RigidBodyType: {
        Dynamic: "dynamic",
        KinematicPositionBased: "kinematic"
      }
    };

    this.world = {
      step: () => {},
      createRigidBody: () => ({
        translation: () => ({x: 0, y: 0, z: 0}),
        rotation: () => ({x: 0, y: 0, z: 0, w: 1}),
        setBodyType: () => {},
        setTranslation: () => {},
        setRotation: () => {},
        setLinvel: () => {}
      }),
      createCollider: () => ({})
    };

    this.fallbackPhysicsSimulation = true;
  }

  step() {
    if (this.world && !this.fallbackPhysicsSimulation) {
      this.world.step();
    }
  }

  updatePhysics() {
    // Обновляем позиции всех объектов с физикой
    for (let i = 0; i < this.rigidBodies.length; i++) {
      const object = this.rigidBodies[i];
      const position = object.body.translation();
      const rotation = object.body.rotation();

      // Обновляем позицию меша
      object.mesh.position.set(position.x, position.y, position.z);
      // Обновляем поворот меша
      object.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }

  addRigidBody(mesh, body) {
    this.rigidBodies.push({ mesh, body });
  }

  getRigidBody(mesh) {
    return this.rigidBodies.find(rb => rb.mesh === mesh)?.body || null;
  }
}
