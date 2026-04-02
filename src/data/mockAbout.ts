export interface Stat {
  label: string;
  value: number;
  suffix: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  dept: string;
  imageUrl: string;
  bio: string;
}

export interface Achievement {
  id: string;
  title: string;
  year: string;
  imageUrl: string;
  description: string;
}

export const MOCK_ABOUT = {
  stats: [
    { label: "Active Members", value: 150, suffix: "+" },
    { label: "Events Hosted", value: 75, suffix: "+" },
    { label: "Telescopes", value: 5, suffix: "" },
    { label: "School Visits", value: 20, suffix: "+" },
  ] as Stat[],

  team: [
    {
      id: "t1",
      name: "Shashank",
      role: "President",
      dept: "Computer Science",
      bio: "Astrophotography enthusiast with a passion for deep sky objects.",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    },
    {
      id: "t2",
      name: "Jordan Orion",
      role: "Vice President",
      dept: "ECE",
      bio: "Focuses on radio astronomy and SDR hardware.",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
    },
    {
      id: "t3",
      name: "Taylor Vega",
      role: "Equipment Head",
      dept: "Mechanical",
      bio: "Maintains our 8-inch Dobsonian and coordinates observation gear.",
      imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    },
    {
      id: "t4",
      name: "Sam Eclipse",
      role: "Events Lead",
      dept: "ISE",
      bio: "Organizes stargazing nights and guest lectures.",
      imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300",
    },
    {
      id: "t5",
      name: "Morgan Star",
      role: "Content Lead",
      dept: "Computer Science",
      bio: "Writes our monthly newsletter and manages social media.",
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300",
    },
  ] as TeamMember[],

  achievements: [
    {
      id: "a1",
      title: "National Astronomy Olympiad — 2nd Place",
      year: "2025",
      description: "Our club represented MVJCE and secured the runner-up position in the national astrophysics theoretical competition.",
      imageUrl: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: "a2",
      title: "ISRO Student Satellite Program",
      year: "2024",
      description: "Selected as one of the few colleges to participate in designing a payload for a sub-orbital flight.",
      imageUrl: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: "a3",
      title: "Best College Club — MVJCE Awards",
      year: "2024",
      description: "Recognized for conducting the most impactful community outreach events.",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600",
    },
  ] as Achievement[],
};
