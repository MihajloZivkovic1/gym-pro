import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memberSchema } from '@/lib/validation';
import { calculateMembershipStatus } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filter parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Build where conditions - this matches your original structure
    const whereConditions = {
      OR: search ? [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ] : undefined
    };

    // Remove undefined properties
    if (!search) {
      delete whereConditions.OR;
    }

    // Fetch members with their active memberships - same as your original
    const members = await prisma.user.findMany({
      where: whereConditions,
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

    // Process members with status - same as your original logic
    const membersWithStatus = members
      .map(member => {
        const activeMembership = member.memberships?.[0];
        let membershipStatus: 'active' | 'expiring' | 'expired' = 'expired';

        if (activeMembership) {
          membershipStatus = calculateMembershipStatus(activeMembership.endDate.toISOString()) as 'active' | 'expiring' | 'expired';
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

    // Apply pagination to the filtered results
    const totalCount = membersWithStatus.length;
    const paginatedMembers = membersWithStatus.slice(skip, skip + limit);

    // Calculate stats
    const stats = {
      total: totalCount,
      active: membersWithStatus.filter(m => m.membershipStatus === 'active').length,
      expiring: membersWithStatus.filter(m => m.membershipStatus === 'expiring').length,
      expired: membersWithStatus.filter(m => m.membershipStatus === 'expired').length
    };

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      members: paginatedMembers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      },
      stats
    });

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
    const {
      firstName,
      lastName,
      email,
      phone,
      subscribeToNewsletter,
      subscribeToNotifications,
      membershipStart,
      planId,
      payment
    } = body;

    if (!firstName || !lastName || !email || !planId || !membershipStart) {
      return NextResponse.json(
        { error: 'Sva obavezna polja moraju biti popunjena' },
        { status: 400 }
      );
    }

    if (!payment || !payment.amount || !payment.paymentMethod || !payment.monthsPaid) {
      return NextResponse.json(
        { error: 'Podaci o plaćanju su obavezni' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Korisnik sa ovim email-om već postoji' },
        { status: 400 }
      );
    }

    const membershipPlan = await prisma.membershipPlan.findUnique({
      where: { id: planId }
    });

    if (!membershipPlan) {
      return NextResponse.json(
        { error: 'Plan članarine nije pronađen' },
        { status: 404 }
      );
    }

    // Calculate membership end date based on months paid
    const startDate = new Date(membershipStart);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + payment.monthsPaid);

    // Calculate next payment due date (after the paid period)
    const nextPaymentDue = new Date(endDate);
    nextPaymentDue.setDate(nextPaymentDue.getDate() + 1);

    // Use transaction to create user, membership, and payment atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the user
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          subscribeToNewsletter: subscribeToNewsletter ?? true,
          subscribeToNotifications: false
        }
      });

      // 2. Create the membership
      const newMembership = await tx.membership.create({
        data: {
          userId: newUser.id,
          planId,
          startDate: startDate,
          endDate: endDate,
          status: 'ACTIVE',
          paymentStatus: 'PAID',
          lastPaymentDate: new Date(payment.paymentDate || membershipStart),
          nextPaymentDue: nextPaymentDue
        }
      });

      // 3. Create the payment record
      const newPayment = await tx.payment.create({
        data: {
          membershipId: newMembership.id,
          userId: newUser.id,
          amount: payment.amount,
          paymentDate: new Date(payment.paymentDate || membershipStart),
          paymentMethod: payment.paymentMethod,
          monthsPaid: payment.monthsPaid,
          notes: payment.notes || null,
          processedBy: 'system' // You can change this to actual user ID if you have auth
        }
      });

      return {
        user: newUser,
        membership: newMembership,
        payment: newPayment
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Član je uspešno kreiran sa prvim plaćanjem',
      data: {
        user: result.user,
        membership: result.membership,
        payment: result.payment
      }
    });

  } catch (error: any) {
    console.error('Create member error:', error);

    // Handle unique constraint errors (email already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Korisnik sa ovim email-om već postoji' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Greška pri kreiranju člana' },
      { status: 500 }
    );
  }
}