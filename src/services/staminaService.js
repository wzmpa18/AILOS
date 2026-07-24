// ============================================================
// src/services/staminaService.js
// 体力系统 — 消耗/恢复/购买
// 每次对话消耗5体力，每10分钟恢复1体力
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

const STAMINA_CONFIG = {
  maxStamina: 100,
  refillIntervalMinutes: 10,
  refillAmount: 1,
  chatCost: 5,
  correctionCost: 3,
  exerciseCost: 3,
};

class StaminaService {
  getConfig() {
    return STAMINA_CONFIG;
  }

  async getStamina(userId) {
    let stamina = await prisma.stamina.findUnique({ where: { userId } });

    if (!stamina) {
      stamina = await prisma.stamina.create({
        data: {
          userId,
          current: STAMINA_CONFIG.maxStamina,
          max: STAMINA_CONFIG.maxStamina,
        },
      });
      return stamina;
    }

    // 自动恢复
    const now = new Date();
    const minutesSinceRefill = Math.floor(
      (now.getTime() - stamina.lastRefillAt.getTime()) / 60000
    );
    const refillCount = Math.floor(minutesSinceRefill / STAMINA_CONFIG.refillIntervalMinutes);

    if (refillCount > 0 && stamina.current < stamina.max) {
      const newStamina = Math.min(
        stamina.current + refillCount * STAMINA_CONFIG.refillAmount,
        stamina.max
      );
      const newRefillAt = new Date(stamina.lastRefillAt);
      newRefillAt.setMinutes(
        newRefillAt.getMinutes() + refillCount * STAMINA_CONFIG.refillIntervalMinutes
      );

      stamina = await prisma.stamina.update({
        where: { userId },
        data: {
          current: newStamina,
          lastRefillAt: newRefillAt,
        },
      });
    }

    return stamina;
  }

  async consumeStamina(userId, amount, reason) {
    const stamina = await this.getStamina(userId);

    if (stamina.current < amount) {
      throw new Error(`Insufficient stamina. Need ${amount}, have ${stamina.current}`);
    }

    const updated = await prisma.stamina.update({
      where: { userId },
      data: { current: { decrement: amount } },
    });

    await prisma.staminaTransaction.create({
      data: {
        userId,
        amount: -amount,
        reason,
      },
    });

    return updated;
  }

  async addStamina(userId, amount, reason) {
    const stamina = await this.getStamina(userId);

    const newAmount = Math.min(stamina.current + amount, stamina.max);

    const updated = await prisma.stamina.update({
      where: { userId },
      data: { current: newAmount },
    });

    await prisma.staminaTransaction.create({
      data: {
        userId,
        amount,
        reason,
      },
    });

    return updated;
  }

  async getTransactions(userId) {
    return prisma.staminaTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

module.exports = new StaminaService();