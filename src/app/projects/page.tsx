import Link from 'next/link';

export default function Projects() {
  const projects = [
    {
      id: 1,
      title: "Weather Balloon Project",
      status: "Active",
      description: "High-altitude balloon launches for atmospheric research, cosmic ray detection, and near-space photography.",
      icon: "🎈",
      team: ["Alex Nova", "Sam Eclipse"]
    },
    {
      id: 2,
      title: "Rocketry Experiments",
      status: "In Development",
      description: "Designing and launching model rockets with custom payloads for data collection and telemetry testing.",
      icon: "🚀",
      team: ["Jordan Orion", "Taylor Vega"]
    },
    {
      id: 3,
      title: "Telescope Workshop Series",
      status: "Ongoing",
      description: "Building and calibrating telescopes from scratch. Members learn optics, mirror grinding, and alignment.",
      icon: "🔭",
      team: ["Alex Nova", "Jordan Orion"]
    },
    {
      id: 4,
      title: "CubeSat Mission Planning",
      status: "Planning",
      description: "Long-term project to design a nano-satellite. Currently in the feasibility study and proposal stage.",
      icon: "🛰️",
      team: ["Full Team"]
    },
  ];

  const statusColors: Record<string, string> = {
    "Active": "#22c55e",
    "In Development": "#f59e0b",
    "Ongoing": "#06b6d4",
    "Planning": "#a78bfa",
  };

  return (
    <div className="page-container">
      <p className="section-title">Our Work</p>
      <h1 className="page-title"><span className="gradient-text">Projects</span></h1>
      <p className="page-subtitle">
        From weather balloons to rocketry — real space experiments built by students.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
        {projects.map((project) => (
          <div key={project.id} className="feature-card" style={{ textAlign: 'left', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{project.icon}</span>
              <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: `${statusColors[project.status]}20`, color: statusColors[project.status], fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {project.status}
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem' }}>{project.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 300, marginBottom: '1rem' }}>{project.description}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 300 }}>Team: {project.team.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
