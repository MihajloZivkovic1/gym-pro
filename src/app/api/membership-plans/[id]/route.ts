import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const membershipPlanSchema = z.object({
  name: z.string().min(2, 'Naziv mora imati najmanje 2 karaktera'),
  price: z.number().positive('Cena mora biti pozitivna'),
  durationMonths: z.number().min(1).max(24, 'Trajanje mora biti između 1 i 24 meseca'),
  isActive: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { memberships: true }
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan članarine nije pronađen' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get membership plan error:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvatanju plana članarine' },
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
    const validatedData = membershipPlanSchema.parse(body);

    // Check if plan exists
    const existingPlan = await prisma.membershipPlan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan članarine nije pronađen' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current plan)
    if (validatedData.name !== existingPlan.name) {
      const duplicatePlan = await prisma.membershipPlan.findFirst({
        where: {
          name: validatedData.name,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicatePlan) {
        return NextResponse.json(
          { error: 'Plan sa ovim nazivom već postoji' },
          { status: 400 }
        );
      }
    }

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name: validatedData.name,
        price: validatedData.price,
        durationMonths: validatedData.durationMonths,
        isActive: validatedData.isActive
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Plan članarine je uspešno ažuriran',
      data: updatedPlan
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Greška validacije',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    console.error('Update membership plan error:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju plana članarine' },
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

    // Check if plan exists
    const plan = await prisma.membershipPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan članarine nije pronađen' },
        { status: 404 }
      );
    }

    // Check if plan has active memberships
    const activeMemberships = await prisma.membership.count({
      where: {
        planId: id,
        status: 'ACTIVE'
      }
    });

    if (activeMemberships > 0) {
      return NextResponse.json(
        {
          error: `Ne možete obrisati plan koji koristi ${activeMemberships} aktivnih članova`,
          activeCount: activeMemberships
        },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive instead of deleting
    await prisma.membershipPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Plan članarine je uspešno obrisan'
    });
  } catch (error) {
    console.error('Delete membership plan error:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju plana članarine' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive mora biti boolean vrednost' },
        { status: 400 }
      );
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan članarine nije pronađen' },
        { status: 404 }
      );
    }

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json({
      success: true,
      message: `Plan je uspešno ${isActive ? 'aktiviran' : 'deaktiviran'}`,
      data: updatedPlan
    });
  } catch (error) {
    console.error('Toggle plan status error:', error);
    return NextResponse.json(
      { error: 'Greška pri promeni statusa plana' },
      { status: 500 }
    );
  }
}