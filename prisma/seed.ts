import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Lista imena za generiranje korisnika
const firstNames = [
  'Marko', 'Ana', 'Stefan', 'Milica', 'Nikola', 'Jovana', 'Miloš', 'Marija',
  'Aleksandar', 'Teodora', 'Petar', 'Sanja', 'Filip', 'Anđela', 'Luka', 'Maja',
  'Nemanja', 'Isidora', 'Uroš', 'Dragana', 'Vukašin', 'Tamara', 'Jovan', 'Nataša',
  'Mihailo', 'Katarina', 'Dušan', 'Jelena', 'Bogdan', 'Ivana', 'Andrija', 'Milena',
  'Dejan', 'Snežana', 'Vladimir', 'Višnja', 'Milan', 'Gordana', 'Dragan', 'Biljana',
  'Zoran', 'Radica', 'Goran', 'Slavica', 'Branko', 'Vesna', 'Srđan', 'Zorica',
  'Nenad', 'Ljiljana', 'Predrag', 'Mirjana', 'Saša', 'Svetlana', 'Bojan', 'Tijana'
];

const lastNames = [
  'Petrović', 'Jovanović', 'Nikolić', 'Stojanović', 'Popović', 'Stanković',
  'Milošević', 'Marković', 'Đorđević', 'Stević', 'Ilić', 'Mladenović',
  'Pavlović', 'Mitrović', 'Kostić', 'Todorović', 'Simić', 'Vuković',
  'Živković', 'Božić', 'Radić', 'Milenković', 'Perić', 'Ristić',
  'Krstić', 'Vasić', 'Lazić', 'Filipović', 'Đukić', 'Maksić',
  'Antić', 'Gajić', 'Radivojević', 'Đurić', 'Marinković', 'Janković'
];

// Funkcija za generiranje random datuma
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Funkcija za generiranje random telefona
function generatePhoneNumber(): string {
  const prefix = ['063', '064', '065', '066', '060', '061', '062'];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
  return `+381 ${randomPrefix.substring(0, 2)} ${randomPrefix.substring(2)} ${randomNumber.toString().substring(0, 3)} ${randomNumber.toString().substring(3)}`;
}

// Funkcija za generiranje email-a
function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 99)}@${domain}`
  ];
  return variations[Math.floor(Math.random() * variations.length)];
}

async function main() {
  console.log('🌱 Starting seed process...')

  // Obriši postojeće podatke (opcionalno - ukloni ovo ako ne želiš)
  console.log('🗑️  Cleaning existing data...')
  await prisma.payment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.membershipPlan.deleteMany({});

  console.log('📋 Creating membership plans...')

  // Kreiraj membership plans
  const basicPlan = await prisma.membershipPlan.create({
    data: {
      name: 'Basic',
      price: 3500, // Ažurirano na 3500
      durationMonths: 1,
    },
  })

  const premiumPlan = await prisma.membershipPlan.create({
    data: {
      name: 'Premium',
      price: 5000,
      durationMonths: 1,

    },
  })

  const studentPlan = await prisma.membershipPlan.create({
    data: {
      name: 'Student',
      price: 2000,
      durationMonths: 1,

    },
  })

  const vipPlan = await prisma.membershipPlan.create({
    data: {
      name: 'VIP',
      price: 8000,
      durationMonths: 1,
    },
  })

  const plans = [basicPlan, premiumPlan, studentPlan, vipPlan];

  console.log(`✅ Created ${plans.length} membership plans`)

  console.log('👥 Creating 100 users with memberships...')

  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  const users = [];

  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    // Kreiraj korisnika
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhoneNumber(),
      },
    });

    users.push(user);

    // Generiši random plan
    const randomPlan = plans[Math.floor(Math.random() * plans.length)];

    // Generiši različite scenarije članarina
    const scenario = Math.floor(Math.random() * 10);

    let startDate: Date;
    let endDate: Date;
    let paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE';
    let membershipStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

    if (scenario <= 4) {
      // 50% - Aktivne članarine (različita vremena)
      startDate = getRandomDate(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), today);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + randomPlan.durationMonths);
      // Dodaj random broj dana (15-45) da varijiramo
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30) + 15);

      paymentStatus = 'PAID';
      membershipStatus = 'ACTIVE';
    } else if (scenario <= 6) {
      // 20% - Uskoro ističu (1-3 dana)
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - randomPlan.durationMonths);
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 dana

      paymentStatus = 'PAID';
      membershipStatus = 'ACTIVE';
    } else if (scenario <= 8) {
      // 20% - Istekle (1-30 dana u prošlosti)
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - randomPlan.durationMonths);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60) - 30); // 30-90 dana ranije
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + randomPlan.durationMonths);

      paymentStatus = Math.random() > 0.5 ? 'OVERDUE' : 'PAID';
      membershipStatus = 'EXPIRED';
    } else {
      // 10% - Otkazane
      startDate = getRandomDate(sixMonthsAgo, today);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30) + 10);

      paymentStatus = 'PAID';
      membershipStatus = 'CANCELLED';
    }

    // Kreiraj membership
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        planId: randomPlan.id,
        startDate,
        endDate,
        status: membershipStatus,
        paymentStatus,
        lastPaymentDate: paymentStatus === 'PAID' ? startDate : null,
        nextPaymentDue: membershipStatus === 'ACTIVE' ? new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000) : null
      },
    });

    // Kreiraj payment za plaćene članarine
    if (paymentStatus === 'PAID') {
      await prisma.payment.create({
        data: {
          membershipId: membership.id,
          userId: user.id,
          amount: randomPlan.price,
          paymentDate: startDate,
          paymentMethod: ['cash', 'card', 'bank_transfer'][Math.floor(Math.random() * 3)],
          monthsPaid: randomPlan.durationMonths,
          notes: Math.random() > 0.7 ? 'Plaćeno u teretani' : null,
          processedBy: 'admin'
        }
      });
    }

    // Kreiraj notifications za aktivne članove kojima uskoro ističe
    if (membershipStatus === 'ACTIVE') {
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Članarina uskoro ističe',
            message: `Poštovani ${firstName}, vaša ${randomPlan.name} članarina ističe za ${daysUntilExpiry} dan${daysUntilExpiry > 1 ? 'a' : ''}.`,
            type: 'MEMBERSHIP_EXPIRING',
            scheduledFor: new Date(),
            isSent: Math.random() > 0.5, // 50% su već poslate
            sentAt: Math.random() > 0.5 ? new Date() : null
          }
        });
      } else if (daysUntilExpiry <= 7 && daysUntilExpiry > 3) {
        // Zakazane notifikacije
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Članarina uskoro ističe',
            message: `Poštovani ${firstName}, vaša ${randomPlan.name} članarina ističe ${endDate.toLocaleDateString('sr-RS')}.`,
            type: 'MEMBERSHIP_EXPIRING',
            scheduledFor: new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 dana ranije
            isSent: false
          }
        });
      }
    }

    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`   Created ${i + 1}/100 users...`);
    }
  }

  console.log('✅ Created 100 users with memberships, payments, and notifications')

  // Statistike
  const stats = await prisma.membership.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  const planStats = await prisma.membership.groupBy({
    by: ['planId'],
    _count: {
      planId: true
    }
  });

  console.log('\n📊 STATISTIKE:')
  console.log('Status članarina:')
  stats.forEach(stat => {
    console.log(`  ${stat.status}: ${stat._count.status} članova`)
  });

  console.log('\nPlanovi članarina:')
  for (const plan of planStats) {
    const planInfo = await prisma.membershipPlan.findUnique({
      where: { id: plan.planId },
      select: { name: true }
    });
    console.log(`  ${planInfo?.name}: ${plan._count.planId} članova`)
  }

  const totalPayments = await prisma.payment.aggregate({
    _sum: {
      amount: true
    },
    _count: {
      id: true
    }
  });

  console.log(`\n💰 Ukupno plaćanja: ${totalPayments._count.id} uplata`)
  console.log(`💵 Ukupan iznos: ${Number(totalPayments._sum.amount || 0).toLocaleString('sr-RS')} RSD`)

  const notificationStats = await prisma.notification.groupBy({
    by: ['isSent'],
    _count: {
      isSent: true
    }
  });

  console.log('\n📧 Notifikacije:')
  notificationStats.forEach(stat => {
    console.log(`  ${stat.isSent ? 'Poslate' : 'Zakazane'}: ${stat._count.isSent}`)
  });

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n🚀 Možete pokrenuti aplikaciju i testirati različite scenarije:')
  console.log('   - Aktivne članarine')
  console.log('   - Članarine koje uskoro ističu')
  console.log('   - Istekle članarine')
  console.log('   - Različite planove (Basic 3500, Premium 5000, Student 2000, VIP 8000)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })