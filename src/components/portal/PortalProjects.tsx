"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/AnimatedCard";
import AnimatedSection from "@/components/AnimatedSection";
import type { MyProject } from "./types";

type PortalProjectsProps = {
  myProjects: MyProject[];
  projectsLoading: boolean;
  limit?: number;
};

export default function PortalProjects({
  myProjects,
  projectsLoading,
  limit,
}: PortalProjectsProps) {
  const visibleProjects = typeof limit === "number" ? myProjects.slice(0, limit) : myProjects;

  return (
    <>
      <AnimatedSection>
        <h2
          style={{
            fontSize: "1.3rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
          My Projects
        </h2>
      </AnimatedSection>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {projectsLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading...</div>
        ) : visibleProjects.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              background: "rgba(15, 22, 40, 0.3)",
              borderRadius: "8px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.88rem",
            }}
          >
            You&apos;re not assigned to any projects yet.
            <br />
            <Link
              href="/projects"
              style={{
                color: "var(--gold)",
                fontSize: "0.8rem",
                marginTop: "0.5rem",
                display: "inline-block",
              }}
            >
              Browse projects →
            </Link>
          </div>
        ) : (
          visibleProjects.map((project, index) => (
            <AnimatedCard
              key={project.id}
              index={index}
              enableTilt={false}
              style={{ textAlign: "left", padding: "1.5rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.4rem",
                  alignItems: "center",
                }}
              >
                <h4 style={{ fontSize: "1rem" }}>{project.name}</h4>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {project.role === "Lead" && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: "rgba(201,168,76,0.15)",
                        color: "var(--gold)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Lead
                    </span>
                  )}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{project.status}</span>
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  background: "var(--border-subtle)",
                  borderRadius: "3px",
                  overflow: "hidden",
                  marginBottom: "0.4rem",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${project.progress}%` }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 1.2,
                    delay: 0.3 + index * 0.2,
                    ease: [0.25, 0.4, 0.25, 1],
                  }}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, var(--gold-dark), var(--gold-light))",
                    borderRadius: "3px",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  {project.progress}% complete
                </span>
                <Link href={`/projects/${project.id}`} style={{ color: "var(--gold)", fontSize: "0.75rem" }}>
                  View →
                </Link>
              </div>
            </AnimatedCard>
          ))
        )}
      </div>
    </>
  );
}
