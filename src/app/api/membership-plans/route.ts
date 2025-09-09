import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const membershipPlanSchema = z.object({
  name: z.string().min(2, 'Naziv mora imati najmanje 2 karaktera'),
  price: z.number().positive('Cena mora biti pozitivna'),
  durationMonths: z.number().min(1).max(24, 'Trajanje mora biti između 1 i 24 meseca'),
  features: z.array(z.string()).optional()
});

export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { memberships: true }
        }
      }
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Membership plans API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = membershipPlanSchema.parse(body);

    const plan = await prisma.membershipPlan.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        durationMonths: validatedData.durationMonths,

      }
    });

    return NextResponse.json({
      success: true,
      message: 'Plan članarine je uspešno kreiran',
      data: plan
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    console.error('Create membership plan error:', error);
    return NextResponse.json(
      { error: 'Greška pri kreiranju plana članarine' },
      { status: 500 }
    );
  }
}