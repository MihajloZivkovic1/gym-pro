import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMembershipStatus } from '@/lib/utils';

export async function GET() {
  try {
    // Fetch all members with their memberships
    const members = await prisma.user.findMany({
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Calculate stats
    const totalMembers = members.length;
    let activeMembers = 0;
    let expiringMembers = 0;
    let expiredMembers = 0;

    members.forEach(member => {
      const activeMembership = member.memberships[0];
      if (activeMembership) {
        const status = calculateMembershipStatus(activeMembership.endDate.toISOString());
        switch (status) {
          case 'active':
            activeMembers++;
            break;
          case 'expiring':
            expiringMembers++;
            break;
          case 'expired':
            expiredMembers++;
            break;
        }
      } else {
        expiredMembers++;
      }
    });

    const stats = {
      totalMembers,
      activeMembers,
      expiringMembers,
      expiredMembers
    };

    // Fetch real recent activities
    interface ActivityItem {
      id: string;
      type: 'payment' | 'new_member' | 'expiring';
      memberName: string;
      description: string;
      time: string;
    }

    const activities: ActivityItem[] = [];

    // Get recent payments (last 7 days)
    const recentPayments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        membership: {
          include: {
            user: true,
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 2
    });

    // Add payment activities
    recentPayments.forEach(payment => {
      const timeAgo = getTimeAgo(payment.createdAt);
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        memberName: `${payment.membership.user.firstName} ${payment.membership.user.lastName}`,
        description: `Platila ${payment.membership.plan.name} - ${payment.amount.toLocaleString()} RSD`,
        time: timeAgo
      });
    });

    // Get recently created members (last 7 days)
    const newMembers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Add new member activities
    newMembers.forEach(member => {
      const timeAgo = getTimeAgo(member.createdAt);
      const planName = member.memberships[0]?.plan.name || 'Osnovni paket';
      activities.push({
        id: `member-${member.id}`,
        type: 'new_member',
        memberName: `${member.firstName} ${member.lastName}`,
        description: `Novi član - ${planName}`,
        time: timeAgo
      });
    });

    // Get members with memberships expiring soon (next 7 days)
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const expiringMembershipsList = await prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: true,
        plan: true
      },
      orderBy: { endDate: 'asc' },
      take: 3
    });

    // Add expiring membership activities
    expiringMembershipsList.forEach(membership => {
      const daysUntilExpiry = Math.ceil((membership.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      activities.push({
        id: `expiring-${membership.id}`,
        type: 'expiring',
        memberName: `${membership.user.firstName} ${membership.user.lastName}`,
        description: `Članarina ističe za ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'dan' : 'dana'}`,
        time: `Za ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'dan' : 'dana'}`
      });
    });

    // Sort activities by most recent first (for mixed activity types)
    // Since we have different time formats, we'll keep them in the order we added them
    // but limit to the most recent 10 activities
    const sortedActivities = activities
      .sort((a, b) => {
        // Simple priority: payments first, then new members, then expiring
        const priority = { 'payment': 0, 'new_member': 1, 'expiring': 2 };
        return priority[a.type as keyof typeof priority] - priority[b.type as keyof typeof priority];
      })
      .slice(0, 10);

    // Expiring memberships (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: thirtyDaysFromNow,
          gte: new Date() // Only future expirations
        }
      },
      include: {
        user: true,
        plan: true
      },
      orderBy: { endDate: 'asc' },
      take: 5
    });

    // Expired memberships (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredMemberships = await prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: new Date(), // Already expired
          gte: thirtyDaysAgo // But not too old (last 30 days)
        }
      },
      include: {
        user: true,
        plan: true
      },
      orderBy: { endDate: 'desc' }, // Most recently expired first
      take: 5
    });

    // Also get members with no active memberships at all
    const membersWithoutActiveMemberships = await prisma.user.findMany({
      where: {
        memberships: {
          none: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { endDate: 'desc' },
          take: 1 // Get their last membership to show when it expired
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Combine expired memberships and members without active memberships
    const allExpiredMemberships = [
      ...expiredMemberships.map(membership => ({
        id: membership.id,
        user: membership.user,
        plan: membership.plan,
        endDate: membership.endDate,
        type: 'expired_membership' as const
      })),
      ...membersWithoutActiveMemberships.map(member => ({
        id: `user-${member.id}`,
        user: member,
        plan: member.memberships[0]?.plan || null,
        endDate: member.memberships[0]?.endDate || member.updatedAt,
        type: 'no_active_membership' as const
      }))
    ]
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime()) // Most recently expired first
      .slice(0, 5); // Limit to 5 most relevant

    return NextResponse.json({
      stats,
      activities: sortedActivities,
      expiringMemberships,
      expiredMemberships: allExpiredMemberships
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Upravo sada';
  } else if (diffInMinutes < 60) {
    return `Pre ${diffInMinutes} ${diffInMinutes === 1 ? 'minut' : 'minuta'}`;
  } else if (diffInHours < 24) {
    return `Pre ${diffInHours}${diffInHours === 1 ? 'h' : 'h'}`;
  } else if (diffInDays < 7) {
    return `Pre ${diffInDays} ${diffInDays === 1 ? 'dan' : 'dana'}`;
  } else {
    return date.toLocaleDateString('sr-RS');
  }
}