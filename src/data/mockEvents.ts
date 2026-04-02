export interface AppEvent {
  id: string;
  title: string;
  description: string; // Short desc for list
  fullDescription: string;
  date: string; // ISO timestamp, e.g., "2026-04-15T22:00:00+05:30"
  location: string;
  type: string; // Stargazing, Workshop, Field Trip, Lecture
  bannerImage: string;
  registrationLink?: string;
  isPublished: boolean;
  media?: string[]; // URLs to photos/videos (only populated for past events)
  internalNotes?: string; // Member coordination notes
}

// Current time is simulated around March 21, 2026
export const MOCK_EVENTS: AppEvent[] = [
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
    internalNotes: "Ensure the SCT is collimated the night before. Need 3 volunteers for crowd control."
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
    internalNotes: "Book the projector in advance. Send out a reminder email to bring cameras."
  },
  {
    id: "evt-003",
    title: "Geminids Meteor Shower",
    description: "Annual trip to the dark sky reserve to watch the most prolific meteor shower of the year.",
    fullDescription: "We traveled 2 hours outside the city to escape the light pollution. The Geminids peak delivered over 60 meteors per hour! It was freezing, but the hot cocoa and the fireballs made it worth it.",
    date: "2025-12-14T23:00:00+05:30",
    location: "Dark Sky Reserve (Off-campus)",
    type: "Field Trip",
    bannerImage: "https://images.unsplash.com/photo-1504333638930-c8787321efa0?w=1200&q=80",
    isPublished: true,
    media: [
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
    ]
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
    media: [
      "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=600&q=80"
    ]
  }
];
