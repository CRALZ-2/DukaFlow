'use strict';
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');
const { generateInviteToken, generateInviteExpiry, isInviteExpired } = require('../utils/generateInvite');
const { SUBSCRIPTION_PLANS } = require('../config/constants');

const SALT_ROUNDS = 12;

module.exports = {
  /**
   * invite — Invite an employee to a shop.
   *
   * Flow:
   *   1. Check plan limit (active employee count vs max)
   *   2. Find or create User by email
   *   3. Check user is not already an active member of this shop
   *   4. $transaction: set invite token on User + create ShopEmployee pivot
   *   5. Return invite token (caller responsible for sending email — Phase 3 stub)
   *
   * @param {string} shopId
   * @param {string} invitedBy — userId of the inviter
   * @param {object} data — { email, firstName, lastName, role }
   */
  invite: async (shopId, invitedBy, data) => {
    const { email, firstName, lastName, role } = data;

    // 1. Plan limit check
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new AppError('Shop not found', 404);

    const planConfig = SUBSCRIPTION_PLANS[shop.subscriptionPlan];
    if (!planConfig) throw new AppError('Unknown subscription plan', 500);

    if (planConfig.maxEmployees !== -1) {
      const activeCount = await prisma.shopEmployee.count({
        where: { shopId, isActive: true, deletedAt: null },
      });
      if (activeCount >= planConfig.maxEmployees) {
        throw new AppError(
          `Plan limit reached: Your ${shop.subscriptionPlan} plan allows a maximum of ` +
          `${planConfig.maxEmployees} employees. Upgrade your plan to add more.`,
          403
        );
      }
    }

    // 2. Find or create User (global email uniqueness)
    let user = await prisma.user.findUnique({ where: { email } });
    const isNewUser = !user;

    // 3. Check not already an active member of this shop
    if (user) {
      const existing = await prisma.shopEmployee.findFirst({
        where: { userId: user.id, shopId, deletedAt: null },
      });
      if (existing && existing.isActive) {
        throw new AppError('This user is already an active member of this shop', 409);
      }
    }

    // 4. $transaction: User + ShopEmployee
    const inviteToken = generateInviteToken();
    const inviteExpiry = generateInviteExpiry(7); // 7-day expiry

    const result = await prisma.$transaction(async (tx) => {
      if (isNewUser) {
        // Create placeholder user — no password yet, mustChangePassword on accept
        const tempPasswordHash = await bcrypt.hash(generateInviteToken(), SALT_ROUNDS);
        user = await tx.user.create({
          data: {
            email,
            password: tempPasswordHash, // placeholder — overwritten on acceptInvite
            firstName,
            lastName,
            mustChangePassword: true,
            isActive: false, // inactive until they accept invite
            inviteToken,
            inviteExpiry,
            createdBy: invitedBy,
          },
        });
      } else {
        // Existing user — just set the invite token
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            inviteToken,
            inviteExpiry,
            mustChangePassword: true,
            updatedBy: invitedBy,
          },
        });
      }

      // Create or reactivate ShopEmployee pivot
      const existingPivot = await tx.shopEmployee.findFirst({
        where: { userId: user.id, shopId },
      });

      let member;
      if (existingPivot) {
        // Reactivate soft-deleted pivot
        member = await tx.shopEmployee.update({
          where: { id: existingPivot.id },
          data: {
            role,
            isActive: true,
            deletedAt: null,
            updatedBy: invitedBy,
          },
        });
      } else {
        member = await tx.shopEmployee.create({
          data: {
            userId: user.id,
            shopId,
            role,
            isActive: true,
            createdBy: invitedBy,
          },
        });
      }

      return { user, member };
    });

    // TODO Phase 9+: Send invite email with token link
    return {
      inviteToken,
      inviteExpiry,
      isNewUser,
      employeeId: result.member.id,
      userId: result.user.id,
      email: result.user.email,
      role,
      message: isNewUser
        ? 'Invite created. Send the invite link to the employee.'
        : 'Existing user linked to shop. Invite token refreshed.',
    };
  },

  /**
   * listEmployees — Get all active employees of a shop.
   */
  listEmployees: async (shopId) => {
    const employees = await prisma.shopEmployee.findMany({
      where: { shopId, isActive: true, deletedAt: null },
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            gender: true, lastLoginAt: true, isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return employees;
  },

  /**
   * updateRole — Change a ShopEmployee's role within the shop.
   */
  updateRole: async (shopId, employeeId, newRole, updatedBy) => {
    const member = await prisma.shopEmployee.findFirst({
      where: { id: employeeId, shopId, isActive: true, deletedAt: null },
    });
    if (!member) throw new AppError('Employee not found in this shop', 404);

    // Prevent changing OWNER role via this endpoint
    if (member.role === 'OWNER') {
      throw new AppError('Cannot change the OWNER role via this endpoint', 403);
    }

    const updated = await prisma.shopEmployee.update({
      where: { id: employeeId },
      data: { role: newRole, updatedBy },
    });

    return updated;
  },

  /**
   * deactivate — Soft-delete a ShopEmployee (set deletedAt + isActive: false).
   */
  deactivate: async (shopId, employeeId, deactivatedBy) => {
    const member = await prisma.shopEmployee.findFirst({
      where: { id: employeeId, shopId, isActive: true, deletedAt: null },
    });
    if (!member) throw new AppError('Employee not found in this shop', 404);

    // Prevent deactivating the shop OWNER
    if (member.role === 'OWNER') {
      throw new AppError('Cannot deactivate the shop owner', 403);
    }

    await prisma.shopEmployee.update({
      where: { id: employeeId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        updatedBy: deactivatedBy,
      },
    });

    return { message: 'Employee deactivated successfully' };
  },

  /**
   * acceptInvite — Employee accepts invite, sets their real password.
   * Activates user account, clears invite token.
   */
  acceptInvite: async (token, newPassword) => {
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
    });

    if (!user) throw new AppError('Invalid invite token', 400);
    if (isInviteExpired(user.inviteExpiry)) throw new AppError('Invite token has expired', 400);

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      // Activate user + set password
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          mustChangePassword: false,
          isActive: true,
          inviteToken: null,
          inviteExpiry: null,
          updatedBy: user.id,
        },
      });

      // Activate their ShopEmployee pivot(s) — they may have been invited to 1+ shops
      await tx.shopEmployee.updateMany({
        where: { userId: user.id, isActive: true, deletedAt: null },
        data: { updatedBy: user.id },
      });
    });

    return { message: 'Invite accepted. You can now log in.' };
  },
};
