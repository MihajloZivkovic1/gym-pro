import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewsletterEmails } from '@/lib/email';

export async function GET() {
  try {
    const newsletters = await prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const totalMembers = await prisma.user.count();

    const stats = {
      totalMembers,
      sentThisMonth: await prisma.newsletter.count({
        where: {
          status: 'SENT',
          sentAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      scheduled: await prisma.newsletter.count({
        where: { status: 'SCHEDULED' }
      })
    };

    return NextResponse.json({
      newsletters,
      stats
    });
  } catch (error) {
    console.error('Get newsletters error:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvatanju obaveštenja' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      title,
      message,
      startDate,
      endDate,
      priority,
      scheduleFor,
      scheduledDate,
      scheduledTime
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Naslov i poruka su obavezni' },
        { status: 400 }
      );
    }

    let status: 'DRAFT' | 'SENT' | 'SCHEDULED' = 'DRAFT';
    let scheduledFor: Date | null = null;
    let sentAt: Date | null = null;
    let recipientCount = 0;

    if (scheduleFor === 'now') {
      status = 'SENT';
      sentAt = new Date();
      recipientCount = await prisma.user.count();
    } else if (scheduleFor === 'later' && scheduledDate && scheduledTime) {
      status = 'SCHEDULED';
      scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
      recipientCount = await prisma.user.count();
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        message,
        type: type.toUpperCase(),
        priority: priority.toUpperCase(),
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        scheduledFor,
        sentAt,
        recipientCount
      }
    });

    if (scheduleFor === 'now') {
      await sendNewsletterEmails(newsletter.id);
    }

    return NextResponse.json({
      success: true,
      message: scheduleFor === 'now'
        ? `Email uspešno poslat na ${recipientCount} adresa!`
        : `Obaveštenje zakazano za ${scheduledDate} u ${scheduledTime}`,
      newsletter
    });

  } catch (error) {
    console.error('Create newsletter error:', error);
    return NextResponse.json(
      { error: 'Greška pri kreiranju obaveštenja' },
      { status: 500 }
    );
  }
}