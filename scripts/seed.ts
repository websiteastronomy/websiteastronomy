/**
 * Seed script — populates the Neon database with mock data.
 * Run with: npx tsx scripts/seed.ts
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";
import ws from "ws";

dotenv.config({ path: ".env.local" });

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // --- EVENTS ---
  console.log("  → Events");
  await db.insert(schema.events).values([
    {
      id: "evt-001",
      title: "Jupiter Opposition Observation",
      description: "Join us at the observatory to view Jupiter at its closest approach to Earth this year.",
      fullDescription: "Jupiter will be in opposition, meaning it will be directly opposite the Sun in our sky and at its closest point to Earth. This is the best time of the year to view the gas giant and its four Galilean moons. We will have our 8-inch Dobsonian and 11-inch SCT telescopes set up. Bring warm clothes and your own binoculars if you have them!",
      date: "2026-04-15T22:00:00+05:30",
      location: "Campus Observatory",
      type: "Stargazing",
      bannerImage: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200&q=80",
      registrationLink: "https://forms.example.com/jupiter",
      isPublished: true,
      media: [],
      internalNotes: "Ensure the SCT is collimated the night before. Need 3 volunteers for crowd control.",
    },
    {
      id: "evt-002",
      title: "Intro to Astrophotography",
      description: "Learn how to capture the Milky Way using just a DSLR and a tripod.",
      fullDescription: "A beginner-friendly workshop covering the basics of wide-field astrophotography. We'll discuss exposure times, ISO settings, the rule of 500, and basic post-processing in Lightroom. No telescope required!",
      date: "2026-04-20T18:00:00+05:30",
      location: "Science Hall 204",
      type: "Workshop",
      bannerImage: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&q=80",
      registrationLink: "https://forms.example.com/astro-workshop",
      isPublished: true,
      media: [],
      internalNotes: "Book the projector in advance.",
    },
    {
      id: "evt-003",
      title: "Geminids Meteor Shower",
      description: "Annual trip to the dark sky reserve to watch the most prolific meteor shower of the year.",
      fullDescription: "We traveled 2 hours outside the city to escape the light pollution. The Geminids peak delivered over 60 meteors per hour!",
      date: "2025-12-14T23:00:00+05:30",
      location: "Dark Sky Reserve (Off-campus)",
      type: "Field Trip",
      bannerImage: "https://images.unsplash.com/photo-1504333638930-c8787321efa0?w=1200&q=80",
      isPublished: true,
      media: [
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
      ],
    },
    {
      id: "evt-004",
      title: "Guest Lecture: Exoplanets",
      description: "Dr. Sarah Kepler discusses the latest discoveries from the James Webb Space Telescope.",
      fullDescription: "An incredible talk on how JWST is analyzing the atmospheres of distant exoplanets to search for biosignatures.",
      date: "2026-02-10T19:00:00+05:30",
      location: "Main Auditorium",
      type: "Lecture",
      bannerImage: "https://images.unsplash.com/photo-1446776858070-70c3d5ed6758?w=1200&q=80",
      isPublished: true,
      media: ["https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=600&q=80"],
    },
  ]).onConflictDoNothing();

  // --- PROJECTS ---
  console.log("  → Projects");
  await db.insert(schema.projects).values([
    {
      id: "proj-001",
      title: "Weather Balloon Project",
      status: "Ongoing",
      description: "Launching high-altitude balloons to capture stratospheric imagery and atmospheric data. Currently on Launch #4.",
      fullDescription: "The high-altitude weather balloon project is one of our flagship initiatives. We construct payloads comprising cameras, GPS trackers, and environmental sensors (temperature, pressure, humidity). These payloads are carried to the stratosphere, reaching altitudes of over 100,000 feet.",
      objective: "To gather atmospheric data profiles over Bangalore and test student-built telemetry systems in near-space conditions.",
      coverImage: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=800&q=80",
      isFeatured: true,
      isPublished: true,
      progress: 75,
      teamSize: 2,
      tags: ["Atmospheric", "Telemetry", "Hardware"],
      team: [
        { name: "Alex Nova", role: "Payload Lead", userId: "user-123" },
        { name: "Jordan Orion", role: "Telemetry & Tracking" }
      ],
      updates: [
        { id: "u1", title: "Launch #3 Success", description: "Payload reached 98,000 ft. All sensors reported nominal.", date: "2026-02-20" },
        { id: "u2", title: "Payload v4 Design Complete", description: "New PCB with integrated GPS and LoRa transmitter is ready.", date: "2026-03-10" }
      ],
      lastUpdated: "2026-03-10",
    },
    {
      id: "proj-002",
      title: "CubeSat Feasibility Study",
      status: "Planned",
      description: "Researching the viability of designing a 1U CubeSat for upper atmosphere observations.",
      fullDescription: "A long-term feasibility study exploring whether the club can design, build, and deploy a 1U CubeSat to Low Earth Orbit.",
      objective: "Complete a mission architecture document and identify potential launch providers for a 1U CubeSat by end of semester.",
      coverImage: "https://images.unsplash.com/photo-1446776858070-70c3d5ed6758?w=800&q=80",
      isFeatured: false,
      isPublished: true,
      progress: 30,
      teamSize: 3,
      tags: ["Satellite", "Research", "Engineering"],
      team: [
        { name: "Sam Eclipse", role: "Project Lead" },
        { name: "Taylor Vega", role: "Researcher" },
        { name: "Morgan Star", role: "Engineer" }
      ],
      updates: [],
      lastUpdated: "2026-03-05",
    },
    {
      id: "proj-003",
      title: "Automated Observatory Dome",
      status: "Ongoing",
      description: "Building a motorized dome system for the campus observatory to allow remote telescope operation.",
      fullDescription: "This project involves designing a motorized dome rotation system controlled via a Raspberry Pi. The goal is to allow members to operate the telescope remotely.",
      objective: "To enable remote observation sessions from any location on campus.",
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
      isFeatured: true,
      isPublished: true,
      progress: 50,
      teamSize: 4,
      tags: ["Automation", "Hardware", "IoT"],
      team: [
        { name: "Alex Nova", role: "Systems Architect" },
        { name: "Jordan Orion", role: "Mechanical Lead" },
        { name: "Taylor Vega", role: "Software Engineer" },
        { name: "Sam Eclipse", role: "Electronics" }
      ],
      updates: [
        { id: "u3", title: "Motor Integration Complete", description: "DC motor successfully drives the dome ring.", date: "2026-03-15" }
      ],
      lastUpdated: "2026-03-15",
    },
  ]).onConflictDoNothing();

  // --- ARTICLES ---
  console.log("  → Articles");
  await db.insert(schema.articles).values([
    {
      id: "edu-001",
      title: "How to Choose Your First Telescope",
      excerpt: "A comprehensive guide to understanding aperture, focal length, and the best beginner mounts.",
      content: "When starting out in astronomy, the first question is always: 'What telescope should I buy?'\n\nThe answer depends on what you want to see.\n\n### 1. The Power of Aperture\nThe most important specification of any telescope is its aperture—the diameter of its main mirror or lens.",
      author: "Alex Nova",
      date: "2026-03-10",
      category: "guide",
      tags: ["Beginner", "Telescopes", "Gear"],
      coverImage: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=800&q=80",
      isPublished: true,
      isFeatured: true,
    },
    {
      id: "edu-002",
      title: "Understanding Orion's Belt",
      excerpt: "Learn how to find Orion and use it to navigate the winter night sky.",
      content: "Orion's Belt is an asterism in the constellation Orion. It consists of the three bright stars Alnitak, Alnilam and Mintaka.",
      author: "Jordan Orion",
      date: "2026-02-15",
      category: "guide",
      tags: ["Constellations", "Beginner", "Navigation"],
      coverImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
      isPublished: true,
      isFeatured: false,
    },
    {
      id: "edu-003",
      title: "The James Webb Space Telescope's Latest Discoveries",
      excerpt: "Breaking down JWST's most recent deep-field images and what they mean for early galaxy formation.",
      content: "NASA's James Webb Space Telescope (JWST) has just released its deepest and sharpest infrared image of the distant universe to date.",
      author: "Dr. Elena Vance",
      date: "2026-03-18",
      category: "article",
      tags: ["News", "JWST", "Deep Space", "Advanced"],
      coverImage: "https://images.unsplash.com/photo-1616161560417-66d40653d4f0?w=800&q=80",
      isPublished: true,
      isFeatured: true,
    },
    {
      id: "edu-004",
      title: "Rocket Basics: Staging and Orbital Mechanics",
      excerpt: "Why do rockets drop pieces as they fly? Understanding the tyranny of the rocket equation.",
      content: "The fundamental problem with reaching orbit is the 'Tyranny of the Rocket Equation.' To lift mass into space, you need fuel. But fuel is heavy.",
      author: "Sam Eclipse",
      date: "2026-01-20",
      category: "guide",
      tags: ["Physics", "Rocketry", "Beginner"],
      coverImage: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",
      isPublished: true,
      isFeatured: false,
    },
  ]).onConflictDoNothing();

  // --- QUIZZES ---
  console.log("  → Quizzes");
  await db.insert(schema.quizzes).values([
    {
      id: "q1",
      title: "Solar System Basics",
      description: "A beginner-friendly quiz about our cosmic neighborhood.",
      difficulty: "Easy",
      estimatedMinutes: 5,
      points: 50,
      questions: [
        { id: "qq1", text: "What is the largest planet in our solar system?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correctOptionIndex: 2 },
        { id: "qq2", text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], correctOptionIndex: 1 },
        { id: "qq3", text: "How many moons does Earth have?", options: ["0", "1", "2", "3"], correctOptionIndex: 1 },
        { id: "qq4", text: "Which planet is closest to the Sun?", options: ["Mercury", "Venus", "Earth", "Mars"], correctOptionIndex: 0 },
        { id: "qq5", text: "Which planet has the most prominent ring system?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correctOptionIndex: 1 },
      ],
    },
    {
      id: "q2",
      title: "Deep Sky Objects",
      description: "Test your knowledge on galaxies, nebulae, and beyond.",
      difficulty: "Medium",
      estimatedMinutes: 5,
      points: 40,
      questions: [
        { id: "qq6", text: "What type of galaxy is the Milky Way?", options: ["Elliptical", "Spiral", "Irregular", "Lenticular"], correctOptionIndex: 1 },
        { id: "qq7", text: "What is the closest major galaxy to the Milky Way?", options: ["Triangulum Galaxy", "Andromeda Galaxy", "Large Magellanic Cloud", "Sombrero Galaxy"], correctOptionIndex: 1 },
      ],
    },
  ]).onConflictDoNothing();

  // --- OBSERVATIONS ---
  console.log("  → Observations");
  await db.insert(schema.observations).values([
    {
      id: "obs-001",
      title: "Orion Nebula (M42) Core",
      category: "deep_sky",
      date: "2026-03-15T23:30:00Z",
      location: "Campus Observatory",
      equipment: "Celestron NexStar 8SE + Canon EOS 60Da",
      settings: { exposure: "30s", iso: "1600", focalLength: "2032mm" },
      images: ["https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80"],
      notes: "Clear skies and excellent seeing. The core of the nebula was visible.",
      observerName: "Alex Nova",
      isApproved: true,
      isFeatured: true,
    },
    {
      id: "obs-002",
      title: "Waxing Gibbous Crater Detail",
      category: "moon",
      date: "2026-03-10T21:15:00Z",
      location: "Science Block Roof",
      equipment: "Orion SkyQuest XT8 + ZWO ASI224MC",
      settings: { exposure: "5ms", iso: "Gain 150", focalLength: "1200mm" },
      images: ["https://images.unsplash.com/photo-1522030299830-16b8d3d049d9?w=1200&q=80"],
      notes: "Focused on the terminator line to capture the sharp shadows across the Tycho crater.",
      observerName: "Jordan Orion",
      isApproved: true,
      isFeatured: false,
    },
    {
      id: "obs-003",
      title: "Jupiter and Galilean Moons transit",
      category: "planet",
      date: "2026-03-05T01:45:00Z",
      location: "Off-Campus Dark Site",
      equipment: "Sky-Watcher 10\" Dobsonian + Smartphone adapter",
      settings: { exposure: "1/60s", iso: "800", focalLength: "1200mm" },
      images: ["https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80"],
      notes: "Could clearly see the Great Red Spot transit.",
      observerName: "Taylor Vega",
      isApproved: true,
      isFeatured: false,
    },
  ]).onConflictDoNothing();

  // --- OUTREACH ---
  console.log("  → Outreach");
  await db.insert(schema.outreach).values([
    {
      id: "out-001",
      title: "Stargazing at Greenwood High",
      type: "school",
      date: "2026-02-15T18:30:00Z",
      location: "Greenwood High School",
      description: "Set up 3 telescopes for the middle school science club. Showed them the craters of the moon and Jupiter's moons.",
      images: ["https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&q=80"],
      stats: { peopleReached: 120, duration: "3 hours", teamSize: 5 },
      isApproved: true,
      isFeatured: true,
    },
    {
      id: "out-002",
      title: "City Square Telescope Event",
      type: "public",
      date: "2026-01-20T19:00:00Z",
      location: "Downtown Plaza",
      description: "Public sidewalk astronomy. Focused on Saturn and the Orion Nebula.",
      images: ["https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200&q=80"],
      stats: { peopleReached: 300, duration: "4 hours", teamSize: 8 },
      isApproved: true,
      isFeatured: false,
    },
    {
      id: "out-003",
      title: "Astro-Photography Workshop",
      type: "workshop",
      date: "2026-03-05T14:00:00Z",
      location: "Community Center",
      description: "Taught the basics of long-exposure photography and post-processing.",
      images: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80"],
      stats: { peopleReached: 40, duration: "5 hours", teamSize: 3 },
      isApproved: true,
      isFeatured: false,
    },
  ]).onConflictDoNothing();

  // --- MEDIA ---
  console.log("  → Media");
  await db.insert(schema.media).values([
    {
      id: "med-001",
      title: "Winter Stargazing Setup",
      type: "image",
      url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80",
      category: "event",
      date: "2026-01-15",
      isFeatured: true,
      photographer: "Alex Nova",
    },
    {
      id: "med-002",
      title: "Deep Space Workshop",
      type: "image",
      url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
      category: "project",
      date: "2026-02-10",
      isFeatured: true,
      photographer: "Jordan Orion",
    },
    {
      id: "med-003",
      title: "Orion Nebula Capture",
      type: "image",
      url: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80",
      category: "observation",
      date: "2026-03-01",
      isFeatured: true,
      photographer: "Taylor Vega",
    },
    {
      id: "med-004",
      title: "Observatory Meeting",
      type: "image",
      url: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&q=80",
      category: "event",
      date: "2026-03-10",
      isFeatured: true,
      photographer: "Sam Eclipse",
    },
  ]).onConflictDoNothing();

  // --- MEMBERS ---
  console.log("  → Members");
  await db.insert(schema.members).values([
    { id: "mem-001", name: "Alex Nova", role: "President" },
    { id: "mem-002", name: "Jordan Orion", role: "Vice President" },
    { id: "mem-003", name: "Taylor Vega", role: "Telescope Lead" },
    { id: "mem-004", name: "Sam Eclipse", role: "Outreach Coordinator" },
    { id: "mem-005", name: "Morgan Star", role: "Technical Lead" },
  ]).onConflictDoNothing();

  // --- ACHIEVEMENTS ---
  console.log("  → Achievements");
  await db.insert(schema.achievements).values([
    { id: "ach-001", title: "First Light", description: "Successfully conducted the first observation night.", dateEarned: "2025-09-15" },
    { id: "ach-002", title: "Sky High", description: "Weather Balloon reached 100,000 ft altitude.", dateEarned: "2026-02-20" },
    { id: "ach-003", title: "Community Star", description: "Reached 500+ people through outreach events.", dateEarned: "2026-03-01" },
  ]).onConflictDoNothing();

  console.log("✅ Seeding complete!");
  await pool.end();
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
