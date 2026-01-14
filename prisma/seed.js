import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const citiesList = [
  { name: "Lisbon", lat: 38.7223, lng: -9.1393 },
  { name: "Chiang Mai", lat: 18.7883, lng: 98.9853 },
  { name: "Ubud", lat: -8.5069, lng: 115.2624 },
  { name: "Medellin", lat: 6.2442, lng: -75.5812 },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
  { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
  { name: "Berlin", lat: 52.5200, lng: 13.4050 },
  { name: "Prague", lat: 50.0755, lng: 14.4378 },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241 }
];

const demoUsers = [
  { email: "alice@demo.local", username: "alice", password: "secret" },
  { email: "bob@demo.local", username: "bob", password: "secret" },
  { email: "carla@demo.local", username: "carla", password: "secret" },
  { email: "dave@demo.local", username: "dave", password: "secret" },
  { email: "eva@demo.local", username: "eva", password: "secret" },
  { email: "frank@demo.local", username: "frank", password: "secret" }
];

const randomFloat = (min, max, dec = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(dec));

const slugify = (s) =>
  s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  console.log("Cleaning database (this will delete existing records)...");
  // optional: remove existing data for clean seed
  await prisma.booking.deleteMany();
  await prisma.media.deleteMany();
  await prisma.post.deleteMany();
  await prisma.event.deleteMany();
  await prisma.place.deleteMany();
  await prisma.route.deleteMany();
  await prisma.city.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating demo users...");
  const users = [];
  for (const u of demoUsers) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.create({
      data: {
        email: u.email,
        username: u.username,
        passwordHash
      }
    });
    users.push(created);
  }

  console.log("Seeding cities, places and events...");
  const createdCities = [];
  for (const c of citiesList) {
    const city = await prisma.city.create({
      data: {
        name: c.name,
        slug: slugify(c.name),
        lat: c.lat,
        lng: c.lng,
        nomadsCount: Math.floor(randomFloat(500, 5000)),
        description: `${c.name} — popular destination for digital nomads`
      }
    });

    // create 10 hotels
    for (let i = 1; i <= 10; i++) {
      const place = await prisma.place.create({
        data: {
          cityId: city.id,
          type: "HOTEL",
          name: `${c.name} Hotel ${i}`,
          rating: randomFloat(3.5, 5.0, 2),
          lat: city.lat + randomFloat(-0.02, 0.02, 5),
          lng: city.lng + randomFloat(-0.02, 0.02, 5),
          description: `Hotel ${i} in ${c.name}`
        }
      });

      // small placeholder media for some places
      if (i % 3 === 0) {
        await prisma.media.create({
          data: {
            filename: `hotel-${i}.txt`,
            mimeType: "text/plain",
            data: Buffer.from(`Placeholder media for ${place.name}`),
            size: 0,
            placeId: place.id
          }
        });
      }
    }

    // create 10 coworking
    for (let i = 1; i <= 10; i++) {
      const place = await prisma.place.create({
        data: {
          cityId: city.id,
          type: "COWORKING",
          name: `${c.name} Coworking ${i}`,
          rating: randomFloat(3.0, 5.0, 2),
          lat: city.lat + randomFloat(-0.02, 0.02, 5),
          lng: city.lng + randomFloat(-0.02, 0.02, 5),
          description: `Coworking ${i} in ${c.name}`
        }
      });

      if (i % 4 === 0) {
        await prisma.media.create({
          data: {
            filename: `coworking-${i}.txt`,
            mimeType: "text/plain",
            data: Buffer.from(`Placeholder media for ${place.name}`),
            size: 0,
            placeId: place.id
          }
        });
      }
    }

    // create 3 events
    for (let e = 1; e <= 3; e++) {
      const start = new Date(Date.now() + 1000 * 60 * 60 * 24 * (7 * e)); // weekly in future
      const end = new Date(start.getTime() + 1000 * 60 * 60 * 4);
      await prisma.event.create({
        data: {
          cityId: city.id,
          title: `${c.name} Nomad Meetup ${e}`,
          startAt: start,
          endAt: end,
          description: `Event ${e} for nomads in ${c.name}`
        }
      });
    }

    // create a sample route (small JSON string)
    const points = [
      { lat: city.lat, lng: city.lng },
      { lat: city.lat + 0.01, lng: city.lng + 0.01 },
      { lat: city.lat + 0.02, lng: city.lng - 0.01 }
    ];
    await prisma.route.create({
      data: {
        authorId: users[Math.floor(Math.random() * users.length)].id,
        cityId: city.id,
        title: `${c.name} Eco Walk`,
        points: JSON.stringify(points),
        ecoScore: Math.floor(randomFloat(60, 95))
      }
    });

    createdCities.push(city);
  }

  console.log("Creating demo posts and media...");
  // create some posts for users with small media
  for (const user of users) {
    for (let p = 0; p < 2; p++) {
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          caption: `Demo post ${p + 1} by ${user.username}`
        }
      });

      await prisma.media.create({
        data: {
          filename: `post-${user.username}-${p + 1}.txt`,
          mimeType: "text/plain",
          data: Buffer.from(`Demo media for ${user.username} post ${p + 1}`),
          size: 0,
          postId: post.id
        }
      });
    }
  }

  console.log("Creating demo bookings...");
  // create random bookings (some for places, some for events)
  const allPlaces = await prisma.place.findMany({ take: 200 });
  const allEvents = await prisma.event.findMany({ take: 200 });

  for (let b = 0; b < 40; b++) {
    const u = users[Math.floor(Math.random() * users.length)];
    const isPlace = Math.random() > 0.4;
    if (isPlace && allPlaces.length) {
      const place = allPlaces[Math.floor(Math.random() * allPlaces.length)];
      const start = new Date(Date.now() + 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 60));
      const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 5) + 1));
      await prisma.booking.create({
        data: {
          userId: u.id,
          placeId: place.id,
          startAt: start,
          endAt: end,
          guests: Math.floor(randomFloat(1, 4)),
          status: ["PENDING", "CONFIRMED", "CANCELLED"][Math.floor(Math.random() * 3)]
        }
      });
    } else if (allEvents.length) {
      const event = allEvents[Math.floor(Math.random() * allEvents.length)];
      await prisma.booking.create({
        data: {
          userId: u.id,
          eventId: event.id,
          startAt: event.startAt,
          endAt: event.endAt,
          guests: 1,
          status: "CONFIRMED"
        }
      });
    }
  }

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });