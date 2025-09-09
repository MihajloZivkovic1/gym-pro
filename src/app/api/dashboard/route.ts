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

    // Recent activity (mock data for now)
    const activities = [
      {
        id: '1',
        type: 'payment',
        memberName: 'Ana Jovanović',
        description: 'Platila mesečnu članarinu - 5000 RSD',
        time: 'Pre 2h'
      },
      {
        id: '2',
        type: 'new_member',
        memberName: 'Marko Petrović',
        description: 'Novi član - Premium pakет',
        time: 'Pre 5h'
      }
    ];

    // Expiring memberships
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: threeDaysFromNow
        }
      },
      include: {
        user: true,
        plan: true
      },
      orderBy: { endDate: 'asc' },
      take: 5
    });

    return NextResponse.json({
      stats,
      activities,
      expiringMemberships
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}