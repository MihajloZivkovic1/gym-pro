import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const membershipPlanSchema = z.object({
  name: z.string().min(2, 'Naziv mora imati najmanje 2 karaktera'),
  price: z.number().positive('Cena mora biti pozitivna'),
  durationMonths: z.number().min(1).max(24, 'Trajanje mora biti između 1 i 24 meseca'),
  isActive: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    // Get plans with pagination
    const [plans, total] = await Promise.all([
      prisma.membershipPlan.findMany({
        where,
        include: {
          _count: {
            select: { memberships: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.membershipPlan.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Membership plans API error:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvatanju planova članarine' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = membershipPlanSchema.parse(body);

    // Check if plan with same name already exists
    const existingPlan = await prisma.membershipPlan.findFirst({
      where: {
        name: validatedData.name,
        isActive: true
      }
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Plan sa ovim nazivom već postoji' },
        { status: 400 }
      );
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        durationMonths: validatedData.durationMonths,
        isActive: validatedData.isActive ?? true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Plan članarine je uspešno kreiran',
      data: plan
    }, { status: 201 });
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

    console.error('Create membership plan error:', error);
    return NextResponse.json(
      { error: 'Greška pri kreiranju plana članarine' },
      { status: 500 }
    );
  }
}