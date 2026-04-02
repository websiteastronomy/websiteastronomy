export type MediaCategory = 'project' | 'event' | 'observation';

export interface MediaItem {
  id: string;
  imageUrl: string;
  caption?: string;
  author: string; // The photographer/contributor
  category: MediaCategory;
  isFeatured: boolean;
  createdAt: string; // ISO String
}

export const MOCK_MEDIA: MediaItem[] = [
  {
    id: "med-001",
    imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80",
    caption: "Our main telescope setup during the Winter Stargazing event. The clear skies allowed perfect tracking of Jupiter.",
    author: "Shashank",
    category: "event",
    isFeatured: true,
    createdAt: "2026-01-15T10:00:00Z"
  },
  {
    id: "med-002",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
    caption: "Deep space photography workshop highlights. Members learning to stack images.",
    author: "Jordan Orion",
    category: "project",
    isFeatured: true,
    createdAt: "2026-02-10T14:30:00Z"
  },
  {
    id: "med-003",
    imageUrl: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80",
    caption: "First successful capture of the Orion Nebula this season by our astrophotography team.",
    author: "Taylor Vega",
    category: "observation",
    isFeatured: true,
    createdAt: "2026-03-01T21:00:00Z"
  },
  {
    id: "med-004",
    imageUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&q=80",
    caption: "Club meeting at the campus observatory analyzing latest captured planetary data.",
    author: "Sam Eclipse",
    category: "event",
    isFeatured: true,
    createdAt: "2026-03-10T18:00:00Z"
  },
  {
    id: "med-005",
    imageUrl: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200&q=80",
    caption: "Telescope calibration and maintenance session during the weekend.",
    author: "Morgan Star",
    category: "project",
    isFeatured: true,
    createdAt: "2026-03-15T15:00:00Z"
  },
  {
    id: "med-006",
    imageUrl: "https://images.unsplash.com/photo-1419242902214-272b38666f54?w=1200&q=80",
    caption: "Not featured: This image sits in the backlog, hidden from the public UI until an admin toggles it.",
    author: "Shashank",
    category: "observation",
    isFeatured: false, // Testing the Hard Rule limit
    createdAt: "2026-03-20T12:00:00Z"
  }
];
