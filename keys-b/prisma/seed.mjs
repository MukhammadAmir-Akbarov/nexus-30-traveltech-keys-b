import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.guide.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding db...');
  
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
    }
  });

  await prisma.guide.create({
    data: {
      name: 'Sherzod (Local Expert)',
      rating: 4.9,
      reviews: 128,
      pricePerDay: 50,
      hourlyRate: 10,
      experienceYears: 5,
      bio: "Men Samarqand va Buxoroning har bir burchagini bilaman.",
      shortBio: "Samarqand va Buxoro tarixiga ixtisoslashgan mahalliy gid.",
      languages: JSON.stringify(["uz", "ru", "en"]),
      verified: true,
      licenseNumber: "GID-2023-001",
      regions: JSON.stringify(["samarkand", "bukhara"]),
      specializations: JSON.stringify(["history", "culture", "food"])
    }
  });
  
  console.log('Done!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
