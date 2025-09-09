import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memberSchema } from '@/lib/validation';
import { calculateMembershipStatus } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Fetch members with their active memberships
    const members = await prisma.user.findMany({
      where: {
        OR: search ? [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ] : undefined
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add computed fields and filter by status
    const membersWithStatus = members
      .map(member => {
        const activeMembership = member.memberships[0];
        let membershipStatus = 'expired';

        if (activeMembership) {
          membershipStatus = calculateMembershipStatus(activeMembership.endDate.toISOString());
        }

        return {
          ...member,
          membershipStatus,
          activeMembership: activeMembership || null
        };
      })
      .filter(member => {
        if (status === 'all') return true;
        return member.membershipStatus === status;
      });

    return NextResponse.json({ members: membersWithStatus });
  } catch (error) {
    console.error('Members API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = memberSchema.parse(body);

    // Create user and membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          phone: validatedData.phone,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName
        }
      });

      const startDate = new Date(validatedData.membershipStart);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + validatedData.membershipDuration);

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          planId: validatedData.planId,
          startDate,
          endDate,
          status: 'ACTIVE',
          paymentStatus: 'PENDING'
        }
      });

      // Create notification for expiry (3 days before)
      const notificationDate = new Date(endDate);
      notificationDate.setDate(notificationDate.getDate() - 3);

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Članarina uskoro ističe',
          message: `Poštovani ${user.firstName}, vaša članarina ističe ${endDate.toLocaleDateString('sr-RS')}.`,
          type: 'MEMBERSHIP_EXPIRING',
          scheduledFor: notificationDate
        }
      });

      return { user, membership };
    });

    return NextResponse.json({
      success: true,
      message: 'Član je uspešno dodat',
      data: result
    });
  } catch (error: any) {
    console.error('Create member error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Korisnik sa ovom email adresom već postoji' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Greška pri kreiranju člana' },
      { status: 500 }
    );
  }
}