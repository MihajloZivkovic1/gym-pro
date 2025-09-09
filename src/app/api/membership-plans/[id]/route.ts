import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const membershipPlanSchema = z.object({
  name: z.string().min(2, 'Naziv mora imati najmanje 2 karaktera'),
  price: z.number().positive('Cena mora biti pozitivna'),
  durationMonths: z.number().min(1).max(24, 'Trajanje mora biti između 1 i 24 meseca'),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { memberships: true }
        },
        memberships: {
          include: {
            user: true
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

    return NextResponse.json({ plan });
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = membershipPlanSchema.parse(body);

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id: params.id },
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
        { error: 'Validation error', details: error },
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
  { params }: { params: { id: string } }
) {
  try {
    // Check if plan has active memberships
    const activeMemberships = await prisma.membership.count({
      where: {
        planId: params.id,
        status: 'ACTIVE'
      }
    });

    if (activeMemberships > 0) {
      return NextResponse.json(
        { error: `Ne možete obrisati plan koji koristi ${activeMemberships} aktivnih članova` },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive instead of deleting
    await prisma.membershipPlan.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Plan članarine je uspešno deaktiviran'
    });
  } catch (error) {
    console.error('Delete membership plan error:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju plana članarine' },
      { status: 500 }
    );
  }
}