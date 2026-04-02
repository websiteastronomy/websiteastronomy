export interface ObservationSettings {
  exposure: string;
  iso: string;
  focalLength: string;
}

export interface Observation {
  id: string;
  title: string;
  category: "moon" | "planet" | "deep_sky";
  date: string; // ISO String
  location: string;
  equipment: string;
  settings: ObservationSettings;
  images: string[];
  notes: string;
  observerName: string;
  isApproved: boolean;
  isFeatured?: boolean;
}

export const MOCK_OBSERVATIONS: Observation[] = [
  {
    id: "obs-001",
    title: "Orion Nebula (M42) Core",
    category: "deep_sky",
    date: "2026-03-15T23:30:00Z",
    location: "Campus Observatory",
    equipment: "Celestron NexStar 8SE + Canon EOS 60Da",
    settings: {
      exposure: "30s",
      iso: "1600",
      focalLength: "2032mm"
    },
    images: ["https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80"],
    notes: "Clear skies and excellent seeing. The core of the nebula was visible, and stacked 20 frames for this final image.",
    observerName: "Shashank",
    isApproved: true,
    isFeatured: true
  },
  {
    id: "obs-002",
    title: "Waxing Gibbous Crater Detail",
    category: "moon",
    date: "2026-03-10T21:15:00Z",
    location: "Science Block Roof",
    equipment: "Orion SkyQuest XT8 + ZWO ASI224MC",
    settings: {
      exposure: "5ms",
      iso: "Gain 150",
      focalLength: "1200mm"
    },
    images: ["https://images.unsplash.com/photo-1522030299830-16b8d3d049d9?w=1200&q=80"],
    notes: "Focused on the terminator line to capture the sharp shadows across the Tycho crater. A mosaic of 4 panels.",
    observerName: "Jordan Orion",
    isApproved: true
  },
  {
    id: "obs-003",
    title: "Jupiter and Galilean Moons transit",
    category: "planet",
    date: "2026-03-05T01:45:00Z",
    location: "Off-Campus Dark Site",
    equipment: "Sky-Watcher 10\" Dobsonian + Smartphone adapter",
    settings: {
      exposure: "1/60s",
      iso: "800",
      focalLength: "1200mm"
    },
    images: ["https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80"],
    notes: "Could clearly see the Great Red Spot transit. Took a 1-minute video and stacked the best 15% of frames using planetary software.",
    observerName: "Taylor Vega",
    isApproved: true
  },
  {
    id: "obs-004",
    title: "Andromeda Wide Field Test",
    category: "deep_sky",
    date: "2026-03-20T03:00:00Z",
    location: "Backyard",
    equipment: "Rokinon 135mm f/2 + Sony A7S",
    settings: {
      exposure: "60s",
      iso: "3200",
      focalLength: "135mm"
    },
    images: ["https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200&q=80"],
    notes: "First attempt at a wide field shot of Andromeda. Still need to process out the light pollution from the edges.",
    observerName: "Sam Eclipse",
    isApproved: false // Mocking an unapproved entry in the moderation queue
  }
];
