"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { getDocument, getCollection } from "@/lib/db";
import Link from "next/link";

export default function ArticleReader() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const article = await getDocument<any>("articles", id);
        setPost(article);
        if (article) {
          const allArticles = await getCollection<any>("articles");
          const related = allArticles
            .filter((p: any) => p.category === article.category && p.id !== article.id && p.isPublished)
            .slice(0, 3);
          setRelatedPosts(related);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Loading article...</p></div>;
  }

  if (!post) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", minHeight: "80vh" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Article Not Found</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>We couldn&apos;t find the content you&apos;re looking for.</p>
        <button onClick={() => router.back()} className="btn-secondary">← Go Back</button>
      </div>
    );
  }

  return (
    <article style={{ paddingBottom: "6rem" }}>
      {/* ── CINEMATIC HEADER ──────────────────────── */}
      <div style={{ position: "relative", width: "100%", height: "65vh", minHeight: "400px", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
          <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "80%", background: "linear-gradient(to top, rgba(8,12,22,1) 0%, rgba(8,12,22,0.6) 50%, transparent 100%)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
          <AnimatedSection>
            <button onClick={() => router.back()} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", marginBottom: "2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", backdropFilter: "blur(4px)" }}>
              ← Back to Education
            </button>
            
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <span style={{ color: "var(--gold)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(201,168,76,0.15)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{post.category}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{post.date}</span>
            </div>
            
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.1, marginBottom: "1.5rem", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
              <span className="gradient-text">{post.title}</span>
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: "bold", fontSize: "1.2rem" }}>
                {post.author.charAt(0)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{post.author}</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--gold-light)" }}>Author / Member</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* ── CONTENT BODY ──────────────────────────── */}
      <div style={{ maxWidth: "800px", margin: "4rem auto 0", padding: "0 2rem" }}>
        <AnimatedSection delay={0.1}>
          <p style={{ fontSize: "1.3rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "3rem", fontStyle: "italic", borderLeft: "4px solid var(--gold)", paddingLeft: "1.5rem" }}>
            {post.excerpt}
          </p>

          <div 
            className="markdown-body" 
            style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text-primary)" }}
            dangerouslySetInnerHTML={{ __html: formatMockContent(post.content) }}
          />

          {/* Tags */}
          <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid var(--border-subtle)" }}>
            <h4 style={{ fontSize: "1rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Tags</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(post.tags || []).map((tag: string) => (
                <span key={tag} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", padding: "0.4rem 1rem", borderRadius: "20px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* ── RELATED CONTENT ────────────────────────── */}
      {relatedPosts.length > 0 && (
        <div style={{ maxWidth: "1000px", margin: "6rem auto 0", padding: "0 2rem" }}>
          <AnimatedSection>
            <h3 style={{ fontSize: "1.8rem", marginBottom: "2rem", textAlign: "center", fontFamily: "'Cinzel', serif" }}>More from <span className="gradient-text">{post.category}</span></h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {relatedPosts.map((related, i) => (
                <motion.div key={related.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Link href={`/education/${related.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ height: "160px", width: "100%" }}>
                      <img src={related.coverImage} alt={related.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1 }}>
                      <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{related.title}</h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem", flex: 1 }}>{related.excerpt}</p>
                      <span style={{ color: "var(--gold)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Read Article →</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      )}
    </article>
  );
}

// Highly simplified mock markdown formatter exclusively for Layer 1
function formatMockContent(text: string) {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.8rem; margin: 2rem 0 1rem; color: var(--gold-light); font-family: \'Cinzel\', serif;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 2.2rem; margin: 2.5rem 0 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 1.5rem;">')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<figure style="margin: 2.5rem 0;"><img src="$2" alt="$1" style="width: 100%; border-radius: 12px; border: 1px solid var(--border-subtle);" /><figcaption style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 0.8rem; font-style: italic;">$1</figcaption></figure>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: var(--gold); text-decoration: underline; text-underline-offset: 4px;">$1</a>');
  
  return `<p style="margin-bottom: 1.5rem;">${html}</p>`;
}
