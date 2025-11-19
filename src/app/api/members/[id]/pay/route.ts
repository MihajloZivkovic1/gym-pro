import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().positive('Iznos mora biti pozitivan'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer']),
  monthsPaid: z.number().min(1).max(24, 'Broj meseci mora biti između 1 i 24'),
  notes: z.string().optional(),
  processedBy: z.string().default('admin')
});
const uuidSchema = z.string().uuid('Nevažeći ID korisnika');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params since it's now a Promise
    const { id: userId } = await params;
    const body = await request.json();


    // Validate input
    const validatedData = paymentSchema.parse(body);

    // Find active membership
    const activeMembership = await prisma.membership.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'EXPIRED'] }
      },
      include: {
        plan: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeMembership) {
      return NextResponse.json(
        { error: 'Član nema članarinu za produžavanje' },
        { status: 404 }
      );
    }

    // Process payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          membershipId: activeMembership.id,
          userId: userId,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          monthsPaid: validatedData.monthsPaid,
          notes: validatedData.notes || '',
          processedBy: validatedData.processedBy
        }
      });

      // Calculate new end date
      let newEndDate = new Date(activeMembership.endDate);
      const today = new Date();

      // If membership is expired, start from today
      if (newEndDate < today) {
        newEndDate = new Date(today);
      }

      newEndDate.setMonth(newEndDate.getMonth() + validatedData.monthsPaid);

      // Calculate next payment due date (1 month after new end date)
      const nextPaymentDue = new Date(newEndDate);
      nextPaymentDue.setDate(nextPaymentDue.getDate() - 30); // 30 days before expiry

      // Update membership
      const updatedMembership = await tx.membership.update({
        where: { id: activeMembership.id },
        data: {
          endDate: newEndDate,
          paymentStatus: 'PAID',
          lastPaymentDate: new Date(),
          nextPaymentDue: nextPaymentDue,
          status: 'ACTIVE' // Reactivate if it was expired
        }
      });

      // Delete old expiry notifications
      await tx.notification.deleteMany({
        where: {
          userId,
          type: 'MEMBERSHIP_EXPIRING',
          isSent: false
        }
      });

      // Create new expiry notification (3 days before new end date)
      const notificationDate = new Date(newEndDate);
      notificationDate.setDate(notificationDate.getDate() - 3);

      await tx.notification.create({
        data: {
          userId,
          title: 'Članarina uskoro ističe',
          message: `Poštovani ${activeMembership.user.firstName}, vaša ${activeMembership.plan.name} članarina ističe ${newEndDate.toLocaleDateString('sr-RS')}.`,
          type: 'MEMBERSHIP_EXPIRING',
          scheduledFor: notificationDate
        }
      });

      return {
        payment,
        membership: updatedMembership,
        newEndDate,
        monthsAdded: validatedData.monthsPaid
      };
    });

    return NextResponse.json({
      success: true,
      message: `Članarina produžena za ${validatedData.monthsPaid} mesec${validatedData.monthsPaid > 1 ? 'i' : ''}`,
      data: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Neispravni podaci', details: error },
        { status: 400 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Nevažeći ID korisnika' },
        { status: 400 }
      );
    }

    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Greška pri procesiranju plaćanja' },
      { status: 500 }
    );
  }
}