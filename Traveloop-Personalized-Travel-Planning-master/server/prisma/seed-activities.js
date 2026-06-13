const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const manali = await prisma.city.findFirst({ where: { name: 'Manali' } });
  const mumbai = await prisma.city.findFirst({ where: { name: 'Mumbai' } });
  const pune = await prisma.city.findFirst({ where: { name: 'Pune' } });

  const activities = [
    {
      name: 'Rohtang Pass Snow Trek',
      description: 'Experience the thrill of snow trekking at Rohtang Pass. Epic views of the Himalayas.',
      category: 'ADVENTURE',
      costPerPerson: 1500,
      durationMinutes: 240,
      cityId: manali.id,
      imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
    },
    {
      name: 'Solang Valley Paragliding',
      description: 'Soar over the beautiful valleys of Manali.',
      category: 'ADVENTURE',
      costPerPerson: 2500,
      durationMinutes: 120,
      cityId: manali.id,
      imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
    },
    {
      name: 'Old Manali Cafe Crawl',
      description: 'Explore the vibrant cafe culture of Old Manali with live music.',
      category: 'FOOD',
      costPerPerson: 800,
      durationMinutes: 180,
      cityId: manali.id,
      imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
    },
    {
      name: 'Gateway of India Heritage Walk',
      description: 'A guided tour of Mumbai\'s colonial past.',
      category: 'CULTURAL',
      costPerPerson: 500,
      durationMinutes: 120,
      cityId: mumbai.id,
      imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
    },
    {
      name: 'Marine Drive Sunset Stroll',
      description: 'Enjoy the ocean breeze at the Queen\'s Necklace.',
      category: 'RELAXATION',
      costPerPerson: 0,
      isFree: true,
      durationMinutes: 90,
      cityId: mumbai.id,
      imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
    },
    {
      name: 'Colaba Causeway Shopping',
      description: 'Street shopping for clothes, antiques, and jewelry.',
      category: 'SHOPPING',
      costPerPerson: 1000,
      durationMinutes: 180,
      cityId: mumbai.id,
      imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
    },
    {
      name: 'Shaniwar Wada Tour',
      description: 'Historical tour of the Peshwa palace ruins.',
      category: 'CULTURAL',
      costPerPerson: 100,
      durationMinutes: 90,
      cityId: pune.id,
      imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80',
    },
    {
      name: 'Koregaon Park Cafe Hopping',
      description: 'Visit the best cafes and bakeries in KP.',
      category: 'FOOD',
      costPerPerson: 600,
      durationMinutes: 180,
      cityId: pune.id,
      imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80',
    },
    {
      name: 'Sinhagad Fort Trek',
      description: 'Early morning trek to the historic fort with pitla bhakri for breakfast.',
      category: 'ADVENTURE',
      costPerPerson: 300,
      durationMinutes: 240,
      cityId: pune.id,
      imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80',
    }
  ];

  for (const act of activities) {
    await prisma.activity.create({ data: act });
  }

  console.log('Successfully seeded activities for Manali, Mumbai, and Pune!');
}

main().catch(console.error).finally(()=>prisma.$disconnect());
