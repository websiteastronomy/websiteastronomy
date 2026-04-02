export interface ProjectUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  images?: string[];
}

export interface ProjectMember {
  name: string;
  role: string;
  img?: string;
  userId?: string;
}

export interface Project {
  id: string;
  title: string;
  status: 'Ongoing' | 'Completed' | 'Planned';
  description: string; // short description for list view
  fullDescription: string;
  objective: string;
  team: ProjectMember[];
  tags: string[];
  coverImage: string;
  isFeatured: boolean;
  isPublished: boolean;
  progress: number;
  lastUpdated: string; // ISO date string or "X days ago" mock
  updates: ProjectUpdate[];
}

// Global mock data to be shared across List, Detail, and Admin pages
export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-001",
    title: "Weather Balloon Project",
    status: "Ongoing",
    description: "Launching high-altitude balloons to capture stratospheric imagery and atmospheric data. Currently on Launch #4.",
    fullDescription: "The high-altitude weather balloon project is one of our flagship initiatives. We construct payloads comprising cameras, GPS trackers, and environmental sensors (temperature, pressure, humidity). These payloads are carried to the stratosphere, reaching altitudes of over 100,000 feet, allowing us to study atmospheric conditions and capture stunning curvature-of-the-Earth photography.",
    objective: "To gather atmospheric data profiles over Bangalore and test student-built telemetry systems in near-space conditions.",
    team: [
      { name: "Alex Nova", role: "Payload Lead", userId: "user-123" },
      { name: "Jordan Orion", role: "Telemetry & Tracking" }
    ],
    tags: ["Atmospheric", "Telemetry", "Hardware"],
    coverImage: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=800&q=80",
    isFeatured: true,
    isPublished: true,
    progress: 75,
    lastUpdated: "2 days ago",
    updates: [
      {
        id: "upd-1",
        title: "Launch #4 Successful Recovery",
        description: "The payload landed safely 40km away. GPS tracking worked flawlessly. Extracting data SD cards now.",
        date: "2026-03-19",
        images: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"]
      },
      {
        id: "upd-2",
        title: "Sensor Calibration",
        description: "Calibrated the BMP280 pressure sensors in the environmental chamber.",
        date: "2026-03-10"
      }
    ]
  },
  {
    id: "proj-002",
    title: "Solid-Fuel Rocketry",
    status: "Planned",
    description: "Designing and testing solid-fuel model rockets with onboard telemetry and parachute deployment systems.",
    fullDescription: "This new initiative focuses on aerodynamics, propulsion, and recovery systems. We are currently designing our first 1-meter class rocket using OpenRocket software, and sourcing custom fiberglass airframes. The goal is to reach an apogee of 1km with a dual-deployment parachute system.",
    objective: "Master the basics of solid-propellant flight dynamics and reliable altimeter-based recovery.",
    team: [
      { name: "Taylor Vega", role: "Aerodynamics" },
      { name: "Sam Eclipse", role: "Recovery Systems" }
    ],
    tags: ["Rocketry", "Propulsion", "Simulation"],
    coverImage: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",
    isFeatured: false,
    isPublished: true,
    progress: 20,
    lastUpdated: "1 week ago",
    updates: [
      {
        id: "upd-3",
        title: "OpenRocket Simulations",
        description: "Finalized the fin design in OpenRocket. We have a stable flight profile approaching Mach 0.8.",
        date: "2026-03-14"
      }
    ]
  },
  {
    id: "proj-003",
    title: "Telescope Refurbishment",
    status: "Completed",
    description: "Restored the physics department's 8-inch Dobsonian telescope, including primary mirror realuminization.",
    fullDescription: "We found an old, unused 8-inch Dobsonian reflector in storage. The mount was rotting, and the primary mirror was heavily oxidized. Over three months, a specialized team rebuilt the rocker box from marine plywood and sent the primary mirror out for professional recoating. It is now our primary instrument for public star parties.",
    objective: "Provide the club with a high-aperture, easy-to-use visual telescope for outreach.",
    team: [
      { name: "Morgan Star", role: "Optics Cleaning" },
      { name: "Alex Nova", role: "Woodworking" }
    ],
    tags: ["Optics", "Maintenance", "Observational"],
    coverImage: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=800&q=80",
    isFeatured: false,
    isPublished: true,
    progress: 100,
    lastUpdated: "3 months ago",
    updates: [
      {
        id: "upd-4",
        title: "First Light!",
        description: "Took the refurbished scope out. Sliced through the Orion Nebula beautifully. Collimation held perfectly.",
        date: "2025-12-10",
        images: ["https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80"]
      }
    ]
  },
  {
    id: "proj-004",
    title: "Radio Meteor Scatter",
    status: "Ongoing",
    description: "Building an antenna array to detect meteors entering the atmosphere using forward-scattered FM radio signals.",
    fullDescription: "Optical observation of meteors requires dark skies and clear weather. By using a Yagi antenna and an SDR (Software Defined Radio), we can \"listen\" to meteors 24/7. When a meteor burns up, it leaves an ionized trail that reflects distant FM radio stations over the horizon. We record these pings to track meteor shower intensities.",
    objective: "Establish a continuous, weather-independent meteor monitoring station on campus.",
    team: [
      { name: "Jordan Orion", role: "SDR Programming" },
      { name: "Sam Eclipse", role: "Antenna Construction" }
    ],
    tags: ["Radio Astronomy", "Data Processing", "Hardware"],
    coverImage: "https://images.unsplash.com/photo-1446776858070-70c3d5ed6758?w=800&q=80",
    isFeatured: false,
    isPublished: true,
    progress: 50,
    lastUpdated: "5 hours ago",
    updates: [
      {
        id: "upd-5",
        title: "First Ping Detected",
        description: "Caught a massive 4-second reflection on 91.1 MHz from a transmitter 400km away. The Python script successfully logged the waterfall spectrum.",
        date: "2026-03-20"
      }
    ]
  }
];
