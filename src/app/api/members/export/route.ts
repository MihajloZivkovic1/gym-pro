import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all members with their related data for export
    const members = await prisma.user.findMany({
      include: {
        memberships: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                durationMonths: true,
                isActive: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          include: {
            membership: {
              include: {
                plan: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        notifications: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to include computed fields
    const exportData = members.map(member => {
      const activeMembership = member.memberships.find(m => m.status === 'ACTIVE');

      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
        memberships: member.memberships.map(membership => ({
          id: membership.id,
          status: membership.status,
          paymentStatus: membership.paymentStatus,
          startDate: membership.startDate.toISOString(),
          endDate: membership.endDate.toISOString(),
          lastPaymentDate: membership.lastPaymentDate?.toISOString() || null,
          nextPaymentDue: membership.nextPaymentDue?.toISOString() || null,
          notes: membership.notes,
          createdAt: membership.createdAt.toISOString(),
          plan: {
            id: membership.plan.id,
            name: membership.plan.name,
            price: Number(membership.plan.price),
            durationMonths: membership.plan.durationMonths,
            isActive: membership.plan.isActive
          }
        })),
        payments: member.payments.map(payment => ({
          id: payment.id,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate.toISOString(),
          paymentMethod: payment.paymentMethod,
          monthsPaid: payment.monthsPaid,
          notes: payment.notes,
          processedBy: payment.processedBy,
          createdAt: payment.createdAt.toISOString(),
          membership: {
            plan: {
              name: payment.membership.plan.name
            }
          }
        })),
        notifications: member.notifications.map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isSent: notification.isSent,
          scheduledFor: notification.scheduledFor.toISOString(),
          sentAt: notification.sentAt?.toISOString() || null,
          createdAt: notification.createdAt.toISOString()
        })),
        // Add computed fields for convenience
        activeMembership: activeMembership ? {
          id: activeMembership.id,
          status: activeMembership.status,
          paymentStatus: activeMembership.paymentStatus,
          startDate: activeMembership.startDate.toISOString(),
          endDate: activeMembership.endDate.toISOString(),
          lastPaymentDate: activeMembership.lastPaymentDate?.toISOString() || null,
          nextPaymentDue: activeMembership.nextPaymentDue?.toISOString() || null,
          plan: {
            id: activeMembership.plan.id,
            name: activeMembership.plan.name,
            price: Number(activeMembership.plan.price),
            durationMonths: activeMembership.plan.durationMonths
          }
        } : null,
        totalPaid: member.payments.reduce((sum, p) => sum + Number(p.amount), 0),
        paymentCount: member.payments.length,
        lastPaymentDate: member.payments.length > 0
          ? member.payments[0].paymentDate.toISOString()
          : null,
        membershipStatus: activeMembership
          ? (new Date(activeMembership.endDate) > new Date() ? 'ACTIVE' : 'EXPIRED')
          : 'NO_MEMBERSHIP'
      };
    });

    return NextResponse.json(exportData);

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Greška pri pripremanju podataka za izvoz' },
      { status: 500 }
    );
  }
}