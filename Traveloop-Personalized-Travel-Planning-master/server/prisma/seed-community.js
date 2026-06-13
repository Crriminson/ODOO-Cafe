'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Wipe existing posts
  await prisma.communityComment.deleteMany();
  await prisma.communityPost.deleteMany();

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const user1 = await prisma.user.findFirst({ where: { email: 'arjun@traveloop.com' } });
  const user2 = await prisma.user.findFirst({ where: { email: 'priya@traveloop.com' } });

  if (!admin || !user1 || !user2) {
    console.error('Users not found - run main seed first'); process.exit(1);
  }

  const posts = [
    { authorId: admin.id, title: 'Best time to visit Manali - complete guide', category: 'TIPS', likes: 34, content: 'Manali is beautiful year-round but the experience varies by season.\n\nSummer (Mar-Jun): Best for trekking, Rohtang Pass (open May onwards). Temperatures 10-25C. Book early.\n\nMonsoon (Jul-Sep): Landslide risk on NH-3, lush greenery, unpredictable.\n\nWinter (Oct-Feb): Snow from December, Solang Valley open for activities.\n\nPro tip: Stay in Old Manali or Vashisht - quieter, better cafes. Guesthouses Rs 800-1200/night.' },
    { authorId: user1.id, title: 'My 7-day Himachal itinerary - everything you need to know', category: 'ITINERARY', likes: 28, content: 'Just back from an epic week in Himachal. Here is what worked:\n\nDay 1-2: Manali - Hadimba Temple, Old Manali, momos everywhere.\nDay 3: Solang Valley paragliding (Rs 1200-1500). Insane views.\nDay 4: Rohtang Pass - book permit at rohtangpermits.nic.in, leave by 6 AM.\nDay 5: Naggar Castle + Kullu shawl shopping.\nDay 6-7: Kasol side trip - Parvati Valley trekking.\n\nTotal budget 7 days all-in: Rs 18,000-22,000 per person from Delhi.' },
    { authorId: user2.id, title: 'Goa in monsoon - underrated or terrible?', category: 'DESTINATION', likes: 41, content: 'Everyone says skip Goa in monsoon. I went anyway.\n\nThe bad: beaches unsafe for swimming, most shacks close.\n\nSurprisingly good:\n- 40-60% cheaper on everything\n- Dudhsagar waterfall is SPECTACULAR in July\n- Zero tourist crowds at Old Goa churches\n- Freshest seafood\n\nWhat to do: Dudhsagar trek, Old Goa heritage walk, spice plantation tour, Panaji Latin Quarter.\n\nVerdict 4/5 - if you are not there for beach sunbathing, monsoon Goa is genuinely great.' },
    { authorId: user2.id, title: 'Delhi food guide - where locals actually eat', category: 'FOOD', likes: 56, content: 'Skip the tourist traps. Where Delhi residents actually go:\n\nChandni Chowk: Paranthe Wali Gali (stuffed parathas since 1875, Rs 60-90), Natraj Dahi Bhalla, Karim\'s for mutton korma.\n\nConnaught Place: Wenger\'s Bakery, Saravana Bhavan.\n\nKhan Market: The Big Chill Cafe (best cheesecake in Delhi).\n\nStreet food tips: Eat from high-turnover stalls. Best hours 7-10 AM and 6-10 PM.\n\nBudget for a serious food day: Rs 400-600 covers a lot.' },
    { authorId: admin.id, title: 'Packing list for a 10-day India trip - what I actually used', category: 'TIPS', likes: 22, content: 'After 6 trips across India, my refined packing list:\n\nClothing: 4 breathable cotton shirts, 2 trousers, 1 light jacket, good walking shoes, a scarf.\n\nHealth: ORS packets (non-negotiable), Imodium, mosquito repellent DEET 30%, sunscreen SPF 50.\n\nTech: Universal adapter (Type D), 10,000 mAh power bank, offline maps downloaded.\n\nDo NOT bring: hairdryer, multiple jeans, anything irreplaceable.\n\nPro moves: Get Airtel/Jio SIM at airport (Rs 299 unlimited), carry Rs 2000-3000 in small bills.' },
    { authorId: user1.id, title: 'Jaipur in 3 days - the non-touristy version', category: 'ITINERARY', likes: 19, content: 'Beyond the standard Amber Fort + Hawa Mahal circuit:\n\nDay 1: Amber Fort at 8 AM (beat the crowds). Audio guide Rs 150.\n\nDay 2 hidden Jaipur: Galtaji Temple (barely any tourists), Panna Meena ka Kund (1548 stepwell, incredible for photos), Albert Hall Museum (has an actual Egyptian mummy).\n\nDay 3 Abhaneri day trip: Chand Baori stepwell - 1200 years old, 13 stories deep, 3500 steps. Mind-blowing.\n\nEat at: LMB for dal baati churma, Rawat Mishtan Bhandar for kachori.' },
  ];

  for (const pd of posts) {
    const post = await prisma.communityPost.create({ data: pd });
    if (pd.title.includes('Manali') && pd.category === 'TIPS') {
      await prisma.communityComment.createMany({ data: [
        { postId: post.id, authorId: user1.id, content: 'Super helpful! Bookmarking for my June trip.' },
        { postId: post.id, authorId: user2.id, content: 'Old Manali is the move. Drifters Inn was perfect.' },
      ]});
    }
    if (pd.title.includes('7-day')) {
      await prisma.communityComment.create({ data: { postId: post.id, authorId: admin.id, content: 'Rohtang permits get exhausted by 6 AM in peak season. Set an alarm!' } });
    }
    if (pd.title.includes('Goa')) {
      await prisma.communityComment.createMany({ data: [
        { postId: post.id, authorId: admin.id, content: 'Dudhsagar in July is one of the best experiences in India. Agree 100%.' },
        { postId: post.id, authorId: user1.id, content: 'Going in August with friends - this convinced me!' },
      ]});
    }
    if (pd.title.includes('Delhi food')) {
      await prisma.communityComment.create({ data: { postId: post.id, authorId: user1.id, content: "Nagpal's chole bhature changed my life. Not an exaggeration." } });
    }
    if (pd.title.includes('Jaipur')) {
      await prisma.communityComment.createMany({ data: [
        { postId: post.id, authorId: user2.id, content: 'Panna Meena ka Kund is so underrated! I was literally the only person there.' },
        { postId: post.id, authorId: admin.id, content: 'Chand Baori goes on every Jaipur itinerary I recommend now.' },
      ]});
    }
  }

  console.log('Community seed done - 6 posts + comments created');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
