import { Decimal } from '@prisma/client/runtime/library';

/**
 * Convert Prisma Decimal to number
 */
export function decimalToNumber(decimal: Decimal): number {
  return Number(decimal.toString());
}

/**
 * Convert null to undefined
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Transform Prisma user data to component-friendly format
 */
export function transformMemberData(member: any) {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: nullToUndefined(member.phone),
    createdAt: member.createdAt,
    membershipStatus: member.membershipStatus,
    activeMembership: member.activeMembership ? {
      id: member.activeMembership.id,
      startDate: member.activeMembership.startDate,
      endDate: member.activeMembership.endDate,
      status: member.activeMembership.status,
      paymentStatus: member.activeMembership.paymentStatus,
      lastPaymentDate: nullToUndefined(member.activeMembership.lastPaymentDate),
      plan: {
        name: member.activeMembership.plan.name,
        price: decimalToNumber(member.activeMembership.plan.price),
        durationMonths: member.activeMembership.plan.durationMonths
      }
    } : undefined,
    stats: member.stats
  };
}

/**
 * Transform memberships array
 */
export function transformMemberships(memberships: any[]) {
  return memberships.map(membership => ({
    id: membership.id,
    startDate: membership.startDate,
    endDate: membership.endDate,
    status: membership.status,
    paymentStatus: membership.paymentStatus,
    plan: {
      name: membership.plan.name,
      price: decimalToNumber(membership.plan.price)
    },
    payments: membership.payments.map((payment: any) => ({
      id: payment.id,
      amount: decimalToNumber(payment.amount),
      paymentDate: payment.paymentDate
    }))
  }));
}

/**
 * Transform payments array
 */
export function transformPayments(payments: any[]) {
  return payments.map(payment => ({
    id: payment.id,
    amount: decimalToNumber(payment.amount),
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    monthsPaid: payment.monthsPaid,
    notes: nullToUndefined(payment.notes),
    membership: {
      plan: {
        name: payment.membership.plan.name
      }
    }
  }));
}

/**
 * Transform notifications array
 */
export function transformNotifications(notifications: any[]) {
  return notifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type as string,
    isSent: notification.isSent,
    scheduledFor: notification.scheduledFor,
    sentAt: nullToUndefined(notification.sentAt),
    createdAt: notification.createdAt
  }));
}