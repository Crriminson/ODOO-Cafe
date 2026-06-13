'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// â”€â”€ City data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const cities = [
  { name:'Manali',country:'India',region:'Himachal Pradesh',latitude:32.2432,longitude:77.1892,costIndex:1,popularityScore:92,description:'Snow-capped Himalayan hill station famed for adventure sports, pine forests, and the Rohtang Pass.',imageUrl:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',timezone:'Asia/Kolkata' },
  { name:'Mumbai',country:'India',region:'Maharashtra',latitude:19.0760,longitude:72.8777,costIndex:2,popularityScore:95,description:'India\'s financial capital â€” Bollywood, street food, colonial architecture, and the Arabian Sea.',imageUrl:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',timezone:'Asia/Kolkata' },
  { name:'Pune',country:'India',region:'Maharashtra',latitude:18.5204,longitude:73.8567,costIndex:1,popularityScore:85,description:'The Oxford of the East â€” vibrant university city with forts, cafes, and year-round pleasant weather.',imageUrl:'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80',timezone:'Asia/Kolkata' },
  { name:'Delhi',country:'India',region:'NCT of Delhi',latitude:28.6139,longitude:77.2090,costIndex:1,popularityScore:93,description:'India\'s capital blends Mughal grandeur with modern megacity energy â€” food, history, and culture.',imageUrl:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',timezone:'Asia/Kolkata' },
  { name:'Goa',country:'India',region:'Goa',latitude:15.2993,longitude:74.1240,costIndex:1,popularityScore:94,description:'Beach paradise with Portuguese heritage, seafood, and legendary sunsets.',imageUrl:'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',timezone:'Asia/Kolkata' },
  { name:'Jaipur',country:'India',region:'Rajasthan',latitude:26.9124,longitude:75.7873,costIndex:1,popularityScore:91,description:'The Pink City â€” palaces, forts, and vibrant bazaars in the heart of Rajasthan.',imageUrl:'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80',timezone:'Asia/Kolkata' },
  { name:'Paris',country:'France',region:'ÃŽle-de-France',latitude:48.8566,longitude:2.3522,costIndex:3,popularityScore:98,description:'The City of Light, famous for art, fashion, and cuisine.',imageUrl:'https://images.unsplash.com/photo-1502602898660-5a24226f5d13?w=800&q=80',timezone:'Europe/Paris' },
  { name:'Tokyo',country:'Japan',region:'Kanto',latitude:35.6762,longitude:139.6503,costIndex:3,popularityScore:99,description:'Ultra-modern metropolis blending tradition with cutting-edge innovation.',imageUrl:'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',timezone:'Asia/Tokyo' },
  { name:'Bali',country:'Indonesia',region:'Lesser Sunda Islands',latitude:-8.3405,longitude:115.0920,costIndex:1,popularityScore:91,description:'Tropical paradise with rice terraces, surf, and Hindu temples.',imageUrl:'https://images.unsplash.com/photo-1537996137-012574e87ff0?w=800&q=80',timezone:'Asia/Makassar' },
  { name:'Dubai',country:'UAE',region:'Dubai',latitude:25.2048,longitude:55.2708,costIndex:3,popularityScore:92,description:'Desert megacity of record-breaking skyscrapers and luxury shopping.',imageUrl:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',timezone:'Asia/Dubai' },
  { name:'Bangkok',country:'Thailand',region:'Central',latitude:13.7563,longitude:100.5018,costIndex:1,popularityScore:94,description:'Bustling street food capital with ornate temples and wild nightlife.',imageUrl:'https://images.unsplash.com/photo-1508009603885-50f6c68a539f?w=800&q=80',timezone:'Asia/Bangkok' },
  { name:'Singapore',country:'Singapore',region:'Central',latitude:1.3521,longitude:103.8198,costIndex:3,popularityScore:91,description:'Garden city famed for food, cleanliness, and futuristic architecture.',imageUrl:'https://images.unsplash.com/photo-1525625293386-3f8f99389eda?w=800&q=80',timezone:'Asia/Singapore' },
  { name:'London',country:'UK',region:'England',latitude:51.5074,longitude:-0.1278,costIndex:3,popularityScore:96,description:'Historic capital with world-class museums and diverse food scenes.',imageUrl:'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',timezone:'Europe/London' },
  { name:'New York',country:'USA',region:'New York',latitude:40.7128,longitude:-74.0060,costIndex:3,popularityScore:97,description:'The city that never sleeps â€” iconic skyline, culture, and energy.',imageUrl:'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',timezone:'America/New_York' },
];

// â”€â”€ Activities per city â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// [name, category, costPerPerson, isFree, durationMinutes, rating]
const activitiesByCityName = {
  Manali: [
    ['Rohtang Pass Snow Trek','ADVENTURE',800,false,360,4.8],
    ['Solang Valley Paragliding','ADVENTURE',1500,false,30,4.9],
    ['Hadimba Devi Temple','CULTURAL',0,true,60,4.7],
    ['Old Manali Market Walk','SHOPPING',0,true,90,4.4],
    ['River Rafting on Beas','ADVENTURE',600,false,120,4.8],
    ['Naggar Castle Visit','CULTURAL',100,false,90,4.6],
    ['CafÃ© Culture & Momos','FOOD',300,false,60,4.9],
    ['Jogini Waterfall Hike','ADVENTURE',0,true,180,4.7],
    ['Kullu Shawl Shopping','SHOPPING',0,false,60,4.3],
    ['Bike Ride to Spiti Valley','ADVENTURE',2500,false,480,5.0],
  ],
  Mumbai: [
    ['Gateway of India Visit','SIGHTSEEING',0,true,60,4.7],
    ['Elephanta Caves Ferry','CULTURAL',700,false,180,4.6],
    ['Marine Drive Sunset Walk','RELAXATION',0,true,60,4.8],
    ['Dharavi Slum Tour','CULTURAL',1200,false,180,4.5],
    ['Juhu Beach Street Food','FOOD',200,false,90,4.7],
    ['Bollywood Studio Tour','CULTURAL',1500,false,180,4.6],
    ['Chhatrapati Shivaji Museum','CULTURAL',85,false,120,4.8],
    ['Colaba Causeway Shopping','SHOPPING',0,false,120,4.4],
    ['Crawford Market Food Walk','FOOD',500,false,90,4.7],
    ['Bandra Bandra Nightlife Walk','ADVENTURE',0,true,120,4.3],
  ],
  Pune: [
    ['Shaniwar Wada Fort','SIGHTSEEING',25,false,90,4.6],
    ['Aga Khan Palace','CULTURAL',25,false,90,4.7],
    ['Sinhagad Fort Trek','ADVENTURE',0,true,240,4.8],
    ['FC Road CafÃ© Hopping','FOOD',400,false,120,4.7],
    ['Osho Ashram Experience','RELAXATION',1500,false,180,4.5],
    ['Lohagad Fort Trek','ADVENTURE',0,true,300,4.7],
    ['Camp Road Street Shopping','SHOPPING',0,false,90,4.3],
    ['Katraj Snake Park','SIGHTSEEING',30,false,60,4.2],
    ['Viman Nagar Food Street','FOOD',300,false,60,4.6],
    ['Koregaon Park Walk','RELAXATION',0,true,60,4.4],
  ],
  Delhi: [
    ['Red Fort Audio Tour','SIGHTSEEING',35,false,120,4.7],
    ['Qutub Minar Sunset Visit','SIGHTSEEING',35,false,90,4.8],
    ['Chandni Chowk Food Walk','FOOD',500,false,120,4.9],
    ['India Gate Evening Walk','SIGHTSEEING',0,true,60,4.7],
    ['Humayun\'s Tomb','CULTURAL',35,false,90,4.8],
    ['Lodhi Garden Morning Walk','RELAXATION',0,true,60,4.6],
    ['Connaught Place Shopping','SHOPPING',0,false,120,4.4],
    ['Old Delhi Rickshaw Ride','ADVENTURE',200,false,60,4.7],
    ['Akshardham Temple Visit','CULTURAL',0,true,180,4.8],
    ['Sarojini Nagar Market','SHOPPING',0,false,90,4.5],
  ],
  Goa: [
    ['Baga Beach Sunrise','RELAXATION',0,true,60,4.7],
    ['Dudhsagar Waterfall Trek','ADVENTURE',800,false,300,4.9],
    ['Old Goa Churches Walk','CULTURAL',0,true,90,4.6],
    ['Calangute Water Sports','ADVENTURE',1200,false,120,4.6],
    ['Spice Plantation Tour','CULTURAL',600,false,180,4.7],
    ['Anjuna Flea Market','SHOPPING',0,true,120,4.4],
    ['Goan Seafood Dinner','FOOD',800,false,90,4.9],
    ['Fort Aguada Sunset','SIGHTSEEING',0,true,60,4.8],
  ],
  Jaipur: [
    ['Amber Fort Elephant Ride','SIGHTSEEING',1000,false,120,4.7],
    ['Hawa Mahal Photography','SIGHTSEEING',50,false,60,4.8],
    ['City Palace Tour','CULTURAL',500,false,120,4.7],
    ['Jantar Mantar Observatory','CULTURAL',200,false,60,4.6],
    ['Johari Bazaar Gem Shopping','SHOPPING',0,false,120,4.5],
    ['Rajasthani Thali Dinner','FOOD',400,false,60,4.9],
    ['Nahargarh Fort Sunset','SIGHTSEEING',50,false,90,4.8],
    ['Blue Pottery Workshop','CULTURAL',600,false,90,4.6],
  ],
  Paris: [
    ['Eiffel Tower Visit','SIGHTSEEING',26,false,120,4.8],
    ['Louvre Museum','CULTURAL',17,false,180,4.9],
    ['Seine River Cruise','RELAXATION',15,false,60,4.6],
    ['Montmartre Walking Tour','SIGHTSEEING',0,true,90,4.5],
    ['French Cooking Class','FOOD',85,false,180,4.7],
  ],
  Tokyo: [
    ['Shibuya Crossing','SIGHTSEEING',0,true,30,4.6],
    ['teamLab Borderless','CULTURAL',32,false,180,4.8],
    ['Tsukiji Outer Market','FOOD',0,true,90,4.7],
    ['Senso-ji Temple','CULTURAL',0,true,60,4.8],
    ['Mount Fuji Day Trip','ADVENTURE',80,false,480,4.9],
  ],
  Bali: [
    ['Ubud Monkey Forest','SIGHTSEEING',3,false,60,4.5],
    ['Tegallalang Rice Terraces','SIGHTSEEING',2,false,90,4.7],
    ['Surf Lesson Kuta','ADVENTURE',25,false,120,4.5],
    ['Balinese Cooking Class','FOOD',40,false,150,4.7],
    ['Tanah Lot Temple Sunset','SIGHTSEEING',3,false,60,4.8],
  ],
  Dubai: [
    ['Burj Khalifa Observation Deck','SIGHTSEEING',35,false,90,4.7],
    ['Desert Safari','ADVENTURE',60,false,360,4.8],
    ['Dubai Creek Abra Ride','TRANSPORT',1,false,15,4.6],
    ['Gold & Spice Souk','SHOPPING',0,true,60,4.6],
  ],
  Bangkok: [
    ['Wat Pho Temple','CULTURAL',3,false,60,4.8],
    ['Grand Palace','SIGHTSEEING',15,false,120,4.7],
    ['Street Food Night Walk','FOOD',20,false,120,4.8],
    ['Thai Cooking Class','FOOD',35,false,150,4.7],
  ],
  Singapore: [
    ['Gardens by the Bay','SIGHTSEEING',14,false,120,4.8],
    ['Hawker Centre Food Tour','FOOD',15,false,90,4.9],
    ['Night Safari','ADVENTURE',47,false,180,4.6],
  ],
  London: [
    ['British Museum','CULTURAL',0,true,180,4.9],
    ['Tower of London','SIGHTSEEING',30,false,120,4.7],
    ['Borough Market','FOOD',0,true,60,4.7],
    ['West End Show','CULTURAL',85,false,150,4.8],
  ],
  'New York': [
    ['Central Park Stroll','RELAXATION',0,true,120,4.7],
    ['Metropolitan Museum of Art','CULTURAL',25,false,180,4.9],
    ['Brooklyn Bridge Walk','SIGHTSEEING',0,true,60,4.7],
    ['Broadway Show','CULTURAL',120,false,180,4.9],
    ['Chelsea Market Food Tour','FOOD',30,false,90,4.6],
  ],
};

async function main() {
  console.log('ðŸŒ± Starting seed...');

  // â”€â”€ Wipe in safe order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await prisma.stopActivity.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.tripNote.deleteMany();
  await prisma.packingItem.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budgetAllocation.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.city.deleteMany();

  // â”€â”€ Cities + activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cityMap = {}; // name â†’ city record
  await prisma.$transaction(async (tx) => {
    for (const cityData of cities) {
      const city = await tx.city.create({ data: cityData });
      cityMap[cityData.name] = city;
      const acts = activitiesByCityName[cityData.name] || [];
      for (const [name, category, costPerPerson, isFree, durationMinutes, rating] of acts) {
        await tx.activity.create({
          data: { name, category, costPerPerson, isFree, durationMinutes, rating, cityId: city.id },
        });
      }
      console.log(`  âœ“ ${cityData.name} (${acts.length} activities)`);
    }
  });

  // â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hash = await bcrypt.hash('Admin@1234', 12);
  const userHash = await bcrypt.hash('User@1234', 12);

  const admin = await prisma.user.create({
    data: { email: 'admin@traveloop.com', passwordHash: hash, name: 'Admin', role: 'ADMIN' },
  });

  const user1 = await prisma.user.create({
    data: { email: 'arjun@traveloop.com', passwordHash: userHash, name: 'Arjun Sharma', role: 'USER' },
  });

  const user2 = await prisma.user.create({
    data: { email: 'priya@traveloop.com', passwordHash: userHash, name: 'Priya Mehta', role: 'USER' },
  });

  console.log('  âœ“ 3 users created');

  // â”€â”€ Helper: create a stop with some activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addStop = async (tx, tripId, cityName, dayOffset, startDate) => {
    const city = cityMap[cityName];
    if (!city) return null;
    const stop = await tx.tripStop.create({
      data: { tripId, cityId: city.id, startDate, endDate: startDate, orderIndex: dayOffset },
    });
    // Grab up to 4 activities for that city
    const cityActs = await tx.activity.findMany({ where: { cityId: city.id }, take: 4 });
    for (let i = 0; i < cityActs.length; i++) {
      await tx.stopActivity.create({
        data: {
          stopId: stop.id, activityId: cityActs[i].id,
          cost: cityActs[i].costPerPerson, dayOffset: i, orderIndex: i,
          customName: cityActs[i].name,
        },
      });
    }
    return stop;
  };

  // â”€â”€ Arjun's trips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await prisma.$transaction(async (tx) => {
    // Trip 1: Himachal Adventure
    const t1 = await tx.trip.create({
      data: {
        creatorId: user1.id, name: 'Himachal Adventure 2025',
        description: 'Snow, pine forests, and river rafting in Manali.',
        startDate: new Date('2025-06-15'), endDate: new Date('2025-06-22'),
        totalBudget: 35000, status: 'PLANNING',
        members: { create: { userId: user1.id, role: 'OWNER' } },
      },
    });
    await addStop(tx, t1.id, 'Manali', 0, new Date('2025-06-15'));
    await tx.expense.create({ data: { tripId: t1.id, category: 'TRANSPORT', amount: 4500, description: 'Delhi to Manali Volvo bus' } });
    await tx.expense.create({ data: { tripId: t1.id, category: 'ACCOMMODATION', amount: 8000, description: 'Riverside cottage 5 nights' } });
    await tx.packingItem.createMany({ data: [
      { tripId: t1.id, name: 'Thermal jacket', category: 'CLOTHING' },
      { tripId: t1.id, name: 'Trekking shoes', category: 'CLOTHING' },
      { tripId: t1.id, name: 'Sunscreen SPF 50', category: 'TOILETRIES' },
      { tripId: t1.id, name: 'Power bank', category: 'ELECTRONICS' },
    ]});
    await tx.tripNote.create({ data: { tripId: t1.id, userId: user1.id, title: 'Rohtang Permit', content: 'Book Rohtang Pass permit online 2 days before â€” only 1200 vehicles allowed daily.' } });

    // Trip 2: Mumbai Weekend
    const t2 = await tx.trip.create({
      data: {
        creatorId: user1.id, name: 'Mumbai Weekend Getaway',
        description: 'Quick city break â€” street food, beaches, and Bollywood vibes.',
        startDate: new Date('2025-08-01'), endDate: new Date('2025-08-03'),
        totalBudget: 12000, status: 'PLANNING',
        members: { create: { userId: user1.id, role: 'OWNER' } },
      },
    });
    await addStop(tx, t2.id, 'Mumbai', 0, new Date('2025-08-01'));
    await tx.expense.create({ data: { tripId: t2.id, category: 'TRANSPORT', amount: 2200, description: 'Flight PNQ-BOM' } });
  });

  // â”€â”€ Priya's trips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await prisma.$transaction(async (tx) => {
    // Trip 1: Golden Triangle
    const t3 = await tx.trip.create({
      data: {
        creatorId: user2.id, name: 'Golden Triangle Tour',
        description: 'Classic Delhi â†’ Jaipur route through Rajasthan.',
        startDate: new Date('2025-10-10'), endDate: new Date('2025-10-17'),
        totalBudget: 40000, status: 'PLANNING',
        members: { create: { userId: user2.id, role: 'OWNER' } },
      },
    });
    await addStop(tx, t3.id, 'Delhi', 0, new Date('2025-10-10'));
    await addStop(tx, t3.id, 'Jaipur', 3, new Date('2025-10-13'));
    await tx.expense.create({ data: { tripId: t3.id, category: 'ACCOMMODATION', amount: 14000, description: 'Heritage hotel Jaipur 4 nights' } });
    await tx.expense.create({ data: { tripId: t3.id, category: 'TRANSPORT', amount: 3500, description: 'Delhi-Jaipur cab' } });
    await tx.packingItem.createMany({ data: [
      { tripId: t3.id, name: 'Light cotton kurtas', category: 'CLOTHING' },
      { tripId: t3.id, name: 'Camera', category: 'ELECTRONICS' },
      { tripId: t3.id, name: 'Sunglasses', category: 'MISCELLANEOUS' },
    ]});

    // Trip 2: Pune-Goa Road Trip
    const t4 = await tx.trip.create({
      data: {
        creatorId: user2.id, name: 'Pune â†’ Goa Road Trip ðŸ–ï¸',
        description: 'Monsoon road trip down the coast with friends.',
        startDate: new Date('2025-07-20'), endDate: new Date('2025-07-25'),
        totalBudget: 20000, status: 'PLANNING',
        members: { create: { userId: user2.id, role: 'OWNER' } },
      },
    });
    await addStop(tx, t4.id, 'Pune', 0, new Date('2025-07-20'));
    await addStop(tx, t4.id, 'Goa', 2, new Date('2025-07-22'));
    await tx.expense.create({ data: { tripId: t4.id, category: 'TRANSPORT', amount: 5000, description: 'Car rental for road trip' } });
    await tx.tripNote.create({ data: { tripId: t4.id, userId: user2.id, title: 'Route Notes', content: 'Take NH-48, stop at Kolhapur for lunch. Avoid driving after 8 PM on ghat sections.' } });
  });

  // â”€â”€ Community posts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const communityPostsData = [
    {
      authorId: admin.id, title: 'ðŸ”ï¸ Best time to visit Manali â€” complete guide',
      category: 'TIPS', likes: 34,
      content: `Manali is beautiful year-round but the experience varies drastically by season.\n\n**Summer (Marâ€“Jun):** Best for trekking, sightseeing, and Rohtang Pass (open from May). Temperatures: 10â€“25Â°C. Book accommodation 2 weeks in advance â€” it fills up fast.\n\n**Monsoon (Julâ€“Sep):** Landslide risk on NH-3. Rohtang often closed. Beautiful lush greenery but unpredictable travel.\n\n**Winter (Octâ€“Feb):** Snow guaranteed from December. Rohtang closed but Solang Valley open for snow activities. Road to Spiti may close entirely.\n\n**Pro tip:** Stay in Old Manali or Vashisht village rather than the main market â€” quieter, better cafes, more authentic vibe. The Maplewood guesthouses along the Beas are â‚¹800â€“â‚¹1200/night and excellent value.`,
    },
    {
      authorId: user1.id, title: 'My 7-day Himachal itinerary â€” everything you need to know',
      category: 'ITINERARY', likes: 28,
      content: `Just got back from an epic week in Himachal. Here's what worked:\n\n**Day 1â€“2: Manali acclimatization**\nArrive by overnight Volvo from Delhi (â‚¹900-1200). Check into Old Manali. Walk to Hadimba Temple, explore the market, eat momos at every cafÃ©.\n\n**Day 3: Solang Valley**\nBook paragliding at the valley (â‚¹1200â€“1500 for 15-min flight). The views are insane. Carry sunscreen â€” altitude sun burns faster.\n\n**Day 4: Rohtang Pass (if open)**\nBook permit online at rohtangpermits.nic.in 2 days prior. Only 1200 vehicles allowed. Leave by 6 AM. Snow time at the top is surreal.\n\n**Day 5: Naggar & Kullu**\nVisit Naggar Castle (Nicholas Roerich Museum is inside!), then drive to Kullu for shawl shopping.\n\n**Day 6â€“7: Kasol side trip**\n2-hour drive from Manali. Parvati Valley has incredible trekking. Stay at Nature's Abode for the river view.\n\nTotal budget for 7 days all-in: â‚¹18,000-22,000 per person including transport from Delhi.`,
    },
    {
      authorId: user2.id, title: 'ðŸŒŠ Goa in monsoon â€” underrated or terrible?',
      category: 'DESTINATION', likes: 41,
      content: `Everyone says don't go to Goa in monsoon. I went anyway. Here's the honest truth:\n\n**The bad:** Beaches are unsafe for swimming (strong currents). Most beach shacks close. Some roads flood briefly after heavy rain.\n\n**The surprisingly good:**\n- 40â€“60% cheaper on everything â€” rooms, food, activities\n- Waterfalls are SPECTACULAR. Dudhsagar in July is a completely different beast than in December\n- Zero tourist crowds. You get Old Goa's churches entirely to yourself\n- The lush green Goa nobody shows on Instagram\n- Seafood is freshest â€” fishing happens year-round\n\n**What to do:**\n- Dudhsagar waterfall trek (book through a reputable operator, check safety conditions day-of)\n- Old Goa heritage walk â€” Basilica of Bom Jesus, Se Cathedral\n- Spice plantation tours (the greenery is peak)\n- Panaji heritage district (Latin Quarter walks)\n- North Goa food exploration â€” no beach crowds means restaurants actually have space\n\n**Verdict:** 4/5 â€” if you're not going for beach sunbathing, monsoon Goa is legitimately great and your budget stretches 40% further.`,
    },
    {
      authorId: user2.id, title: 'Delhi food guide â€” where locals actually eat',
      category: 'FOOD', likes: 56,
      content: `Skip the tourist traps. Here's where Delhi residents actually go:\n\n**Chandni Chowk (must-do)**\n- Paranthe Wali Gali â€” the original stuffed parathas since 1875. â‚¹60â€“90 per paratha\n- Natraj Dahi Bhalla â€” legendary. The curd is always perfect\n- Jain Coffee House for breakfast\n- Karim's near Jama Masjid for mutton korma\n\n**Connaught Place**\n- Wenger's Bakery for pastries (colonial-era institution)\n- United Coffee House for the ambiance\n- Saravana Bhavan for South Indian\n\n**Khan Market**\n- The Big Chill CafÃ© (best cheesecakes in Delhi)\n- Chez Nini for French bakery goods\n\n**Lajpat Nagar / Defence Colony**\n- Nagpal's Chole Bhature (Lajpat Nagar market)\n- Sagar Ratna for idli-dosa\n\n**Street food pro tips:**\n- Eat from stalls with high turnover â€” freshness is everything\n- Stick to cooked/fried items if your stomach isn't acclimatized\n- Best hours: 7â€“10 AM (breakfast stalls) or 6â€“10 PM (evening snacks)\n\nBudget for a serious food day: â‚¹400â€“600 covers a LOT.`,
    },
    {
      authorId: admin.id, title: 'ðŸŽ’ Packing list for a 10-day India trip â€” what I actually used',
      category: 'TIPS', likes: 22,
      content: `After 6 trips across India, this is my refined packing list:\n\n**Clothing (pack less than you think)**\n- 4 breathable cotton/linen shirts (synthetics + India heat = misery)\n- 2 trousers (one for temples/formal, one casual)\n- 1 light jacket (for AC trains/airports even in summer)\n- Comfortable walking shoes + sandals\n- Scarf/dupatta (temple dress code + sun protection + instant pillow)\n\n**Health & Safety**\n- ORS packets â€” non-negotiable\n- Imodium + antacids\n- Mosquito repellent (DEET 30%+)\n- Sunscreen SPF 50+\n- Hand sanitizer (always)\n- Small first aid kit\n\n**Tech**\n- Universal travel adapter (Type D is India standard)\n- Portable power bank (10,000 mAh minimum â€” power cuts happen)\n- Offline maps downloaded (Google Maps or Maps.me)\n- Screenshot your tickets â€” data can be spotty\n\n**What NOT to bring**\n- Hairdryer (voltage issues, and every hotel has one)\n- Multiple pairs of jeans (too heavy, too hot)\n- Anything valuable you can't replace\n\n**Pro moves:**\n- Get a local SIM at the airport (Airtel/Jio, â‚¹299 for 28 days unlimited data)\n- Carry â‚¹2000â€“3000 in small bills â€” many vendors can't break large notes\n- Download Zomato, Swiggy, and Ola/Uber before you land`,
    },
    {
      authorId: user1.id, title: 'Jaipur in 3 days â€” the non-touristy version',
      category: 'ITINERARY', likes: 19,
      content: `Done the standard Amber Fort + Hawa Mahal circuit? Here's what to do instead (or in addition):\n\n**Day 1: The fort deep-dive (yes, you still need to do it right)**\nAmber Fort opens at 8 AM â€” arrive then. Beat 90% of the crowds. Hire the audio guide (â‚¹150) â€” it's actually excellent and explains the mirror rooms and war elephants in context. Take the elephant pathway up if budget allows (controversial but the views are unique).\n\n**Day 2: The hidden Jaipur**\n- Galtaji Temple (the monkey temple) â€” 9 km from city, barely any tourists, beautiful ravine setting\n- Panna Meena ka Kund â€” a stepwell from 1548 that few visitors know about. Perfectly geometric, incredible for photography\n- Albert Hall Museum â€” underrated, has a genuine Egyptian mummy\n- Johri Bazaar at sunset â€” for silver jewelry without the tourist markup of Johari Bazaar\n\n**Day 3: Day trip to Abhaneri**\n- Chand Baori stepwell â€” 1200-year-old, 13 stories deep, 3500 steps. One of the most mind-bending structures in the world\n- 85 km from Jaipur, easy day trip\n- Combine with Bhangarh Fort (most haunted place in India â€” it's locked after sunset by government order)\n\n**Eat at:** Laxmi Mishtan Bhandar (LMB) for dal baati churma. Anokhi CafÃ© for a quiet breakfast. Rawat Mishtan Bhandar for kachori.`,
    },
  ];

  for (const postData of communityPostsData) {
    const post = await prisma.communityPost.create({ data: postData });
    // Add 1â€“2 comments per post
    if (post.title.includes('Manali')) {
      await prisma.communityComment.create({ data: { postId: post.id, authorId: user1.id, content: 'This is super helpful! Bookmarking for my June trip.' } });
      await prisma.communityComment.create({ data: { postId: post.id, authorId: user2.id, content: 'Can confirm â€” Old Manali is the move. Stayed at Drifters Inn and it was perfect.' } });
    }
    if (post.title.includes('7-day')) {
      await prisma.communityComment.create({ data: { postId: post.id, authorId: admin.id, content: 'Great writeup! One note â€” Rohtang permits get exhausted by 6 AM most days in peak season. Set an alarm.' } });
    }
    if (post.title.includes('Goa')) {
      await prisma.communityComment.create({ data: { postId: post.id, authorId: admin.id, content: 'Totally agree on Dudhsagar in July. It\'s genuinely one of the best experiences I\'ve had in India.' } });
      await prisma.communityComment.create({ data: { postId: post.id, authorId: user1.id, content: 'Going in August with friends, this convinced me. Thanks!' } });
    }
    if (post.title.includes('Delhi food')) {
      await prisma.communityComment.create({ data: { postId: post.id, authorId: user1.id, content: 'Nagpal\'s chole bhature changed my life. That\'s not an exaggeration.' } });
    }
    if (post.title.includes('Jaipur')) {
      await prisma.communityComment.create({ data: { postId: post.id, authorId: user2.id, content: 'Panna Meena ka Kund is so underrated! I was literally the only person there.' } });
      await prisma.communityComment.create({ data: { postId: post.id, authorId: admin.id, content: 'Adding Chand Baori to every Jaipur itinerary I recommend now. Completely blew my mind.' } });
    }
  }
  console.log('  \u2713 6 community posts + comments created');

  console.log('');
  console.log('  Accounts:');
  console.log('  admin@traveloop.com  / Admin@1234  (ADMIN)');
main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
  console.log('  arjun@traveloop.com  / User@1234   (USER - 2 trips)');
  console.log('  priya@traveloop.com  / User@1234   (USER - 2 trips)');
  console.log('SUCCESS Seed complete');
}

