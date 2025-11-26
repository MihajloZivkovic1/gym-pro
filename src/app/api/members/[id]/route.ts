import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMembershipStatus } from '@/lib/utils';
import bcrypt from 'bcryptjs';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const member = await prisma.user.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Prepare update data
    const updateData: any = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone
    };

    // Handle password change if provided
    if (body.newPassword) {
      // Verify current password first
      const user = await prisma.user.findUnique({
        where: { id },
        select: { password: true }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Korisnik nije pronađen' },
          { status: 404 }
        );
      }

      if (!user.password) {
        return NextResponse.json(
          { error: 'Korisnik nema postavljenu lozinku' },
          { status: 400 }
        );
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(body.currentPassword, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Trenutna lozinka je netačna' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(body.newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedMember = await prisma.user.update({
      where: { id },
      data: updateData,
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
      message: body.newPassword
        ? 'Član i lozinka su uspešno ažurirani'
        : 'Član je uspešno ažuriran',
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.user.delete({
      where: { id }
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