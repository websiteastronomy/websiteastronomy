export interface EducationPost {
  id: string;
  title: string;
  content: string; // Can be long text or markdown-like
  excerpt: string; // Short preview
  author: string;
  date: string;
  category: "fact" | "article" | "guide";
  tags: string[];
  coverImage: string;
  isPublished: boolean;
  isFeatured: boolean; // For Pinning
}

// Global Setting Payload
export const EDUCATION_SETTINGS = {
  dailyFact: "Jupiter has more than 90 moons, and its largest moon, Ganymede, is bigger than the planet Mercury."
};

// Seed Data
export const MOCK_EDUCATION: EducationPost[] = [
  {
    id: "edu-001",
    title: "How to Choose Your First Telescope",
    excerpt: "A comprehensive guide to understanding aperture, focal length, and the best beginner mounts.",
    content: "When starting out in astronomy, the first question is always: 'What telescope should I buy?' \n\nThe answer depends on what you want to see. \n\n### 1. The Power of Aperture\nThe most important specification of any telescope is its aperture—the diameter of its main mirror or lens. A larger aperture gathers more light, allowing you to see fainter objects and resolve finer details. For beginners, a 6-inch or 8-inch Dobsonian reflector is universally recommended because it gives you the most aperture for your money.\n\n### 2. Mount Types\nAvoid cheap equatorial (EQ) mounts. They are heavy, difficult to align, and frustrating for visual use. Stick to Alt-Azimuth or Dobsonian mounts, which simply move up, down, left, and right.",
    author: "Shashank",
    date: "2026-03-10",
    category: "guide",
    tags: ["Beginner", "Telescopes", "Gear"],
    coverImage: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=800&q=80",
    isPublished: true,
    isFeatured: true
  },
  {
    id: "edu-002",
    title: "Understanding Orion's Belt",
    excerpt: "Learn how to find Orion and use it to navigate the winter night sky.",
    content: "Orion's Belt is an asterism in the constellation Orion. It consists of the three bright stars Alnitak, Alnilam and Mintaka.\n\nLooking for Orion's Belt in the night sky is the easiest way to locate Orion in the sky. The stars are more or less evenly distributed in a straight line, and so can be visualized as the belt of the hunter's clothing. They are best visible in the early night sky during the Northern Winter/Southern Summer, in particular the month of January at around 9:00 pm.",
    author: "Jordan Orion",
    date: "2026-02-15",
    category: "guide",
    tags: ["Constellations", "Beginner", "Navigation"],
    coverImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
    isPublished: true,
    isFeatured: false
  },
  {
    id: "edu-003",
    title: "The James Webb Space Telescope's Latest Discoveries",
    excerpt: "Breaking down JWST's most recent deep-field images and what they mean for early galaxy formation.",
    content: "NASA's James Webb Space Telescope (JWST) has just released its deepest and sharpest infrared image of the distant universe to date. \n\nKnown as Webb's First Deep Field, this image of galaxy cluster SMACS 0723 is overflowing with detail. Thousands of galaxies—including the faintest objects ever observed in the infrared—have appeared in Webb’s view for the first time. \n\nResearchers are using this data to study the mass, age, history, and composition of these ancient galaxies, seeking back to the earliest moments of the universe.",
    author: "Dr. Elena Vance",
    date: "2026-03-18",
    category: "article",
    tags: ["News", "JWST", "Deep Space", "Advanced"],
    coverImage: "https://images.unsplash.com/photo-1616161560417-66d40653d4f0?w=800&q=80",
    isPublished: true,
    isFeatured: true
  },
  {
    id: "edu-004",
    title: "Rocket Basics: Staging and Orbital Mechanics",
    excerpt: "Why do rockets drop pieces as they fly? Understanding the tyranny of the rocket equation.",
    content: "The fundamental problem with reaching orbit is the 'Tyranny of the Rocket Equation.' To lift mass into space, you need fuel. But fuel is heavy, which means you need more fuel to lift the fuel.\n\n### Staging\nThis is why rockets use staging. When a lower stage runs out of propellant, it is massive dead weight. By detaching it and igniting the next stage, the rocket sheds mass and dramatically increases its total delta-v (change in velocity).",
    author: "Sam Eclipse",
    date: "2026-01-20",
    category: "guide",
    tags: ["Physics", "Rocketry", "Beginner"],
    coverImage: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",
    isPublished: true,
    isFeatured: false
  },
  {
    id: "edu-005",
    title: "The Physics of Black Holes",
    excerpt: "Demystifying event horizons, singularities, and spaghettification.",
    content: "A black hole is a region of spacetime where gravity is so strong that nothing—no particles or even electromagnetic radiation such as light—can escape from it. The theory of general relativity predicts that a sufficiently compact mass can deform spacetime to form a black hole.",
    author: "Member 88",
    date: "2026-03-20",
    category: "article",
    tags: ["Physics", "Advanced"],
    coverImage: "https://images.unsplash.com/photo-1446776858070-70c3d5ed6758?w=800&q=80",
    isPublished: false, // Drafted by a member
    isFeatured: false
  }
];
