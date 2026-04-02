export interface OutreachStats {
  peopleReached: number;
  duration: string;
  teamSize?: number;
}

export type OutreachType = 'school' | 'public' | 'ngo' | 'workshop';

export interface Outreach {
  id: string;
  title: string;
  type: OutreachType;
  date: string; // ISO string for sorting
  location: string;
  description: string;
  images: string[]; // Mandatory proof
  stats: OutreachStats;
  isApproved: boolean; // For moderation workflow
  isFeatured?: boolean; // Highlight on list
}

export const MOCK_OUTREACH: Outreach[] = [
  {
    id: "out-001",
    title: "Stargazing at Greenwood High",
    type: "school",
    date: "2026-02-15T18:30:00Z",
    location: "Greenwood High School",
    description: "Set up 3 telescopes for the middle school science club. Showed them the craters of the moon and Jupiter's moons. Great enthusiasm from the kids!",
    images: ["https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&q=80"],
    stats: {
      peopleReached: 120,
      duration: "3 hours",
      teamSize: 5
    },
    isApproved: true,
    isFeatured: true
  },
  {
    id: "out-002",
    title: "City Square Telescope Event",
    type: "public",
    date: "2026-01-20T19:00:00Z",
    location: "Downtown Plaza",
    description: "Public sidewalk astronomy. Focused on Saturn and the Orion Nebula. Many passersby had never looked through a telescope before.",
    images: ["https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200&q=80"],
    stats: {
      peopleReached: 300,
      duration: "4 hours",
      teamSize: 8
    },
    isApproved: true
  },
  {
    id: "out-003",
    title: "Astro-Photography Workshop",
    type: "workshop",
    date: "2026-03-05T14:00:00Z",
    location: "Community Center",
    description: "Taught the basics of long-exposure photography and post-processing using DeepSkyStacker to a group of local photographers.",
    images: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80"],
    stats: {
      peopleReached: 40,
      duration: "5 hours",
      teamSize: 3
    },
    isApproved: true
  },
  {
    id: "out-004",
    title: "Orphanage Science Day",
    type: "ngo",
    date: "2026-03-25T10:00:00Z",
    location: "Hope Orphanage",
    description: "Draft post: conducting a solar observation session using solar filters and discussing the solar system.",
    images: ["https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80"],
    stats: {
      peopleReached: 50,
      duration: "2 hours",
      teamSize: 4
    },
    isApproved: false // Simulating an entry that requires admin approval
  }
];
