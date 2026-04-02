export interface MoonPhase {
  phase: string;
  illumination: number; // percentage
  daysUntilFull: number;
  imageUrl: string;
}

export interface PlanetVisibility {
  id: string;
  name: string;
  constellation: string;
  magnitude: number;
  riseTime: string;
  setTime: string;
  isNakedEyeVisible: boolean;
  imageUrl: string;
}

export interface CelestialEvent {
  id: string;
  title: string;
  dateStr: string;
  type: 'Meteor Shower' | 'Eclipse' | 'Conjunction' | 'Opposition' | 'Other';
  description: string;
  visibilityRating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  imageUrl?: string;
}

export const MOCK_NIGHT_SKY = {
  moon: {
    phase: "Waning Gibbous",
    illumination: 78,
    daysUntilFull: 18,
    imageUrl: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?auto=format&fit=crop&q=80&w=400",
  } as MoonPhase,

  planets: [
    {
      id: "p1",
      name: "Jupiter",
      constellation: "Taurus",
      magnitude: -2.3,
      riseTime: "18:45",
      setTime: "04:30",
      isNakedEyeVisible: true,
      imageUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: "p2",
      name: "Saturn",
      constellation: "Aquarius",
      magnitude: 0.9,
      riseTime: "02:15",
      setTime: "14:00",
      isNakedEyeVisible: true,
      imageUrl: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: "p3",
      name: "Mars",
      constellation: "Gemini",
      magnitude: 1.2,
      riseTime: "22:10",
      setTime: "11:20",
      isNakedEyeVisible: true,
      imageUrl: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: "p4",
      name: "Venus",
      constellation: "Pisces",
      magnitude: -3.9,
      riseTime: "05:00",
      setTime: "18:00",
      isNakedEyeVisible: true,
      imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=200",
    }
  ] as PlanetVisibility[],

  upcomingEvents: [
    {
      id: "evt1",
      title: "Eta Aquariid Meteor Shower",
      dateStr: "May 4-5, 2026",
      type: "Meteor Shower",
      description: "Produced by dust particles left behind by comet Halley. Best viewing will be from a dark location after midnight.",
      visibilityRating: "Good",
    },
    {
      id: "evt2",
      title: "Total Lunar Eclipse",
      dateStr: "May 26, 2026",
      type: "Eclipse",
      description: "A total lunar eclipse visible from East Asia, Australia, the Pacific, and the Americas.",
      visibilityRating: "Excellent",
      imageUrl: "https://images.unsplash.com/photo-1532692743834-03aab61962da?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "evt3",
      title: "Saturn at Opposition",
      dateStr: "Sep 8, 2026",
      type: "Opposition",
      description: "The ringed planet will be at its closest approach to Earth and its face will be fully illuminated by the Sun. It will be brighter than any other time of the year and will be visible all night long.",
      visibilityRating: "Excellent",
    }
  ] as CelestialEvent[],
};
