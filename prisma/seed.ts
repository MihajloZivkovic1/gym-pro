import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate random date within range
const randomDateBetween = (start: Date, end: Date): Date => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
};

// Helper function to add months to date
const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
  'Steven', 'Carol', 'Paul', 'Ruth', 'Joshua', 'Sharon', 'Kenneth', 'Michelle',
  'Kevin', 'Laura', 'Brian', 'Sarah', 'George', 'Kimberly', 'Edward', 'Deborah',
  'Ronald', 'Dorothy', 'Timothy', 'Lisa', 'Jason', 'Nancy', 'Jeffrey', 'Karen',
  'Ryan', 'Betty', 'Jacob', 'Helen', 'Gary', 'Sandra', 'Nicholas', 'Donna',
  'Eric', 'Carol', 'Jonathan', 'Ruth', 'Stephen', 'Sharon', 'Larry', 'Michelle',
  'Justin', 'Laura', 'Scott', 'Sarah', 'Brandon', 'Kimberly', 'Benjamin', 'Deborah',
  'Samuel', 'Dorothy', 'Gregory', 'Amy', 'Alexander', 'Angela', 'Patrick', 'Ashley',
  'Frank', 'Brenda', 'Raymond', 'Emma', 'Jack', 'Olivia', 'Dennis', 'Cynthia',
  'Jerry', 'Marie', 'Tyler', 'Janet', 'Aaron', 'Catherine', 'Jose', 'Frances'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
];

const generatePhoneNumber = (): string => {
  const area = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1${area}${exchange}${number}`;
};

async function main() {
  console.log('🏋️ Starting gym database seeding...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.user.deleteMany();

  // Create membership plans
  console.log('📋 Creating membership plans...');
  const membershipPlans = await Promise.all([
    prisma.membershipPlan.create({
      data: {
        name: 'Monthly Basic',
        price: 29.99,
        durationMonths: 1,
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Quarterly Premium',
        price: 79.99,
        durationMonths: 3,
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Annual VIP',
        price: 299.99,
        durationMonths: 12,
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Student Monthly',
        price: 19.99,
        durationMonths: 1,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${membershipPlans.length} membership plans`);

  // Create 120 users
  console.log('👥 Creating 120 users...');
  const users = [];

  for (let i = 0; i < 120; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
    const phone = Math.random() < 0.8 ? generatePhoneNumber() : null; // 80% have phone numbers

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        firstName,
        lastName,
        createdAt: randomDateBetween(new Date('2023-01-01'), new Date('2024-12-01')),
      },
    });

    users.push(user);
  }

  console.log(`✅ Created ${users.length} users`);

  // Create active memberships for ALL 120 users expiring in October 2025
  console.log('🎫 Creating active memberships for all users...');
  const currentDate = new Date('2025-09-18'); // Current date
  const memberships = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const plan = membershipPlans[Math.floor(Math.random() * membershipPlans.length)];

    // Generate random expiration date in October 2025 (1st to 31st)
    const octoberDay = Math.floor(Math.random() * 31) + 1;
    const endDate = new Date(2025, 9, octoberDay); // October is month 9 (0-indexed)

    // Calculate start date based on plan duration
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - plan.durationMonths);

    // All memberships are active and paid
    const status: 'ACTIVE' = 'ACTIVE';
    const paymentStatus: 'PAID' = 'PAID';
    const lastPaymentDate = startDate;

    // Set next payment due for monthly plans
    let nextPaymentDue: Date | null = null;
    if (plan.durationMonths === 1) {
      nextPaymentDue = new Date(endDate);
    }

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        planId: plan.id,
        startDate,
        endDate,
        status,
        paymentStatus,
        lastPaymentDate,
        nextPaymentDue,
        notes: Math.random() < 0.1 ? 'Special arrangement - corporate discount' : null,
        createdAt: startDate,
      },
    });

    memberships.push(membership);
  }

  console.log(`✅ Created ${memberships.length} memberships`);

  // Create payment history
  console.log('💳 Creating payment history...');
  let paymentCount = 0;

  for (const membership of memberships) {
    const plan = membershipPlans.find(p => p.id === membership.planId)!;
    const user = users.find(u => u.id === membership.userId)!;

    // Create initial payment for most memberships
    if (membership.paymentStatus !== 'PENDING' && membership.lastPaymentDate) {
      await prisma.payment.create({
        data: {
          membershipId: membership.id,
          userId: user.id,
          amount: plan.price,
          paymentDate: membership.lastPaymentDate,
          paymentMethod: Math.random() < 0.7 ? 'card' : 'cash',
          monthsPaid: plan.durationMonths,
          processedBy: 'system',
          createdAt: membership.lastPaymentDate,
        },
      });
      paymentCount++;
    }

    // For active monthly memberships, create additional payments
    if (membership.status === 'ACTIVE' && plan.durationMonths === 1 && membership.startDate) {
      let paymentDate = new Date(membership.startDate);
      const endDate = membership.endDate;

      while (paymentDate < endDate && paymentDate < currentDate) {
        paymentDate = addMonths(paymentDate, 1);

        if (paymentDate < currentDate) {
          await prisma.payment.create({
            data: {
              membershipId: membership.id,
              userId: user.id,
              amount: plan.price,
              paymentDate,
              paymentMethod: Math.random() < 0.7 ? 'card' : 'cash',
              monthsPaid: 1,
              processedBy: Math.random() < 0.5 ? 'front_desk' : 'auto_billing',
              createdAt: paymentDate,
            },
          });
          paymentCount++;
        }
      }
    }
  }

  console.log(`✅ Created ${paymentCount} payments`);

  // Create notifications for October expiring memberships
  console.log('🔔 Creating notifications for October expiring memberships...');

  let notificationCount = 0;
  for (const membership of memberships) {
    const user = users.find(u => u.id === membership.userId)!;
    const daysUntilExpiry = Math.ceil((membership.endDate!.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create expiring notification for memberships expiring in the next 30 days
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      const isAlreadySent = Math.random() < 0.4; // 40% already sent

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Membership Expiring in October',
          message: `Hi ${user.firstName}, your gym membership expires on ${membership.endDate!.toLocaleDateString()}. Please renew to continue enjoying our facilities.`,
          type: 'MEMBERSHIP_EXPIRING',
          isSent: isAlreadySent,
          scheduledFor: new Date(membership.endDate!.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before expiry
          sentAt: isAlreadySent ? new Date(membership.endDate!.getTime() - 7 * 24 * 60 * 60 * 1000) : null,
          createdAt: new Date(membership.endDate!.getTime() - 14 * 24 * 60 * 60 * 1000), // Created 14 days before expiry
        },
      });
      notificationCount++;
    }
  }

  console.log(`✅ Created ${notificationCount} notifications`);

  // Create a sample newsletter
  console.log('📧 Creating sample newsletter...');
  await prisma.newsletter.create({
    data: {
      title: 'New Year, New You - Special Offers Inside!',
      message: 'Start your fitness journey with our special New Year promotions. Join now and get 20% off your first month!',
      type: 'GENERAL',
      priority: 'HIGH',
      status: 'SENT',
      scheduledFor: new Date('2025-01-01'),
      sentAt: new Date('2025-01-01'),
      recipientCount: users.length,
      createdAt: new Date('2024-12-15'),
    },
  });

  console.log('✅ Created sample newsletter');

  // Print summary statistics
  console.log('\n📊 SEEDING SUMMARY:');
  console.log(`👥 Users: ${users.length}`);
  console.log(`🎫 Memberships: ${memberships.length} (All Active)`);
  console.log(`💳 Payments: ${paymentCount}`);
  console.log(`🔔 Notifications: ${notificationCount}`);

  const expiringInOctober = memberships.filter(m => {
    if (!m.endDate) return false;
    return m.endDate.getMonth() === 9; // October is month 9 (0-indexed)
  }).length;

  // Group by expiration week in October
  const week1 = memberships.filter(m => m.endDate && m.endDate.getDate() <= 7).length;
  const week2 = memberships.filter(m => m.endDate && m.endDate.getDate() > 7 && m.endDate.getDate() <= 14).length;
  const week3 = memberships.filter(m => m.endDate && m.endDate.getDate() > 14 && m.endDate.getDate() <= 21).length;
  const week4 = memberships.filter(m => m.endDate && m.endDate.getDate() > 21).length;

  console.log(`\n📅 OCTOBER EXPIRATION BREAKDOWN:`);
  console.log(`🗓️  Week 1 (Oct 1-7): ${week1} memberships`);
  console.log(`🗓️  Week 2 (Oct 8-14): ${week2} memberships`);
  console.log(`🗓️  Week 3 (Oct 15-21): ${week3} memberships`);
  console.log(`🗓️  Week 4 (Oct 22-31): ${week4} memberships`);
  console.log(`📊 Total expiring in October: ${expiringInOctober}`);

  console.log('\n🎉 All 120 users have active memberships expiring in October 2025!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });