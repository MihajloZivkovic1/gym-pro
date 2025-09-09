import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMembershipStatus } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          include: {
            membership: { include: { plan: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        notifications: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Član nije pronađen' },
        { status: 404 }
      );
    }

    // Add computed fields
    const activeMembership = member.memberships.find(m => m.status === 'ACTIVE');
    const membershipStatus = activeMembership
      ? calculateMembershipStatus(activeMembership.endDate.toISOString())
      : 'expired';

    return NextResponse.json({
      ...member,
      membershipStatus,
      activeMembership
    });
  } catch (error) {
    console.error('Get member error:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvatanju člana' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updatedMember = await prisma.user.update({
      where: { id: params.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Član je uspešno ažuriran',
      data: updatedMember
    });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju člana' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Član je uspešno obrisan'
    });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju člana' },
      { status: 500 }
    );
  }
}