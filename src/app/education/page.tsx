"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedCard from "@/components/AnimatedCard";
import { loadSiteSettingsClient } from "@/data/siteSettingsStatic";
import { getPublishedArticlesAction, saveArticleAction } from "@/app/actions/articles";
import { ARTICLE_KNOWLEDGE_CATEGORIES } from "@/lib/article-workflow";
import { useAuth } from "@/context/AuthContext";
import ArticleCoverImageField from "@/components/ArticleCoverImageField";
import { formatDateStable } from "@/lib/format-date";

const inputStyle = {
  padding: "0.8rem 1rem",
  background: "rgba(15, 22, 40, 0.5)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "6px",
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  width: "100%",
};

export default function EducationHub() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState(() => loadSiteSettingsClient());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<"all" | "article" | "guide" | "fact">("all");
  const [knowledgeCategory, setKnowledgeCategory] = useState("all");
  const [showMemberUpload, setShowMemberUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    contentType: "article",
    knowledgeCategory: "Theory",
    excerpt: "",
    tags: "",
    coverImageUrl: "",
    content: "",
  });

  const loadArticles = async () => {
    try {
      const rows = await getPublishedArticlesAction();
      setArticles(rows);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadArticles();
  }, []);

  const filteredPosts = useMemo(() => {
    return articles.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesType = activeType === "all" || post.contentType === activeType;
      const matchesKnowledge =
        knowledgeCategory === "all" || post.knowledgeCategory === knowledgeCategory;
      return matchesSearch && matchesType && matchesKnowledge;
    });
  }, [activeType, articles, knowledgeCategory, searchQuery]);

  const featuredArticles = filteredPosts.filter((post) => post.isFeatured).slice(0, 3);
  const latestArticles = filteredPosts.filter((post) => post.contentType === "article").slice(0, 6);
  const latestGuides = filteredPosts.filter((post) => post.contentType === "guide").slice(0, 6);
  const latestFacts = filteredPosts.filter((post) => post.contentType === "fact").slice(0, 6);
  const isFiltering =
    searchQuery.trim() !== "" || activeType !== "all" || knowledgeCategory !== "all";

  const submitMemberDraft = async () => {
    if (!user) {
      setFeedback({ type: "error", message: "Please sign in before submitting an article." });
      return;
    }
    if (!formState.title.trim() || !formState.content.trim()) {
      setFeedback({ type: "error", message: "Title and content are required." });
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);
    try {
      await saveArticleAction(
        {
          title: formState.title,
          contentType: formState.contentType as any,
          knowledgeCategory: formState.knowledgeCategory,
          excerpt: formState.excerpt,
          tags: formState.tags,
          coverImageUrl: formState.coverImageUrl,
          content: formState.content,
        },
        "review"
      );
      setShowMemberUpload(false);
      setFormState({
        title: "",
        contentType: "article",
        knowledgeCategory: "Theory",
        excerpt: "",
        tags: "",
        coverImageUrl: "",
        content: "",
      });
      setFeedback({ type: "success", message: "Article submitted for review." });
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to submit article." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <AnimatedSection>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p className="section-title">Knowledge Base</p>
          <h1 className="page-title"><span className="gradient-text">Education Hub</span></h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "700px", margin: "0 auto", fontSize: "1.1rem" }}>
            Explore articles, guides, and astronomy facts curated through the club’s review workflow.
          </p>
        </div>
      </AnimatedSection>

      {!isFiltering && (
        <AnimatedSection delay={0.1}>
          <div style={{ background: "linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(12, 18, 34, 0.4))", border: "1px solid var(--gold-dark)", borderRadius: "16px", padding: "2rem", marginBottom: "3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <h3 style={{ color: "var(--gold)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "1rem" }}>Daily Fact</h3>
            <p style={{ fontSize: "1.4rem", color: "var(--text-primary)", fontWeight: 300, maxWidth: "820px", margin: "0 auto", lineHeight: 1.6 }}>
              &ldquo;{siteSettings?.dailyFact?.text || "The universe is filled with wonders yet to be discovered."}&rdquo;
            </p>
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection delay={0.2} style={{ marginBottom: "3rem" }}>
        <div style={{ display: "grid", gap: "1rem", background: "rgba(15, 22, 40, 0.4)", padding: "1rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            {["all", "article", "guide", "fact"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type as any)}
                style={{
                  background: activeType === type ? "var(--gold)" : "transparent",
                  color: activeType === type ? "#000" : "var(--text-primary)",
                  border: `1px solid ${activeType === type ? "var(--gold)" : "var(--border-subtle)"}`,
                  padding: "0.5rem 1.2rem",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  textTransform: "capitalize",
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search by title or tag"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={inputStyle}
            />
            <select value={knowledgeCategory} onChange={(event) => setKnowledgeCategory(event.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="all">All Topics</option>
              {ARTICLE_KNOWLEDGE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button onClick={() => setShowMemberUpload(true)} className="btn-primary" style={{ padding: "0.8rem 1.2rem", fontSize: "0.9rem", cursor: "pointer" }}>
              Submit Article
            </button>
          </div>
        </div>
      </AnimatedSection>

      {feedback ? (
        <div style={{
          marginBottom: "2rem",
          padding: "0.9rem 1rem",
          borderRadius: "10px",
          border: `1px solid ${feedback.type === "error" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
          background: feedback.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          color: feedback.type === "error" ? "#fca5a5" : "#86efac",
          fontSize: "0.9rem",
        }}>
          {feedback.message}
        </div>
      ) : null}

      {isFiltering ? (
        <AnimatedSection delay={0.3}>
          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>No articles match your criteria.</p>
              <button onClick={() => { setSearchQuery(""); setActiveType("all"); setKnowledgeCategory("all"); }} className="btn-secondary" style={{ marginTop: "1rem", cursor: "pointer" }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid">
              {filteredPosts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          )}
        </AnimatedSection>
      ) : (
        <>
          <AnimatedSection delay={0.3} style={{ marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>Featured Articles</h2>
            {featuredArticles.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Featured content will appear here once published.</p>
            ) : (
              <div className="grid">
                {featuredArticles.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>
            )}
          </AnimatedSection>

          <AnimatedSection delay={0.4} style={{ marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>Latest Articles</h2>
            <div className="grid">
              {latestArticles.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.5} style={{ marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>Guides</h2>
            <div className="grid">
              {latestGuides.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.6} style={{ marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>Facts</h2>
            <div className="grid">
              {latestFacts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </AnimatedSection>
        </>
      )}

      <AnimatePresence>
        {showMemberUpload ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(5, 8, 15, 0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
            onClick={() => setShowMemberUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              style={{ background: "#0c1222", border: "1px solid var(--gold-dark)", borderRadius: "12px", padding: "2rem", maxWidth: "760px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            >
              <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--gold)" }}>Submit Knowledge Base Article</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                Your article will enter the Core review queue, then move to admin publishing once approved.
              </p>

              <div style={{ display: "grid", gap: "1rem" }}>
                <input value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} placeholder="Title" style={inputStyle} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <select value={formState.contentType} onChange={(event) => setFormState((current) => ({ ...current, contentType: event.target.value }))} style={inputStyle}>
                    <option value="article">Article</option>
                    <option value="guide">Guide</option>
                    <option value="fact">Fact</option>
                  </select>
                  <select value={formState.knowledgeCategory} onChange={(event) => setFormState((current) => ({ ...current, knowledgeCategory: event.target.value }))} style={inputStyle}>
                    {ARTICLE_KNOWLEDGE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <input value={formState.tags} onChange={(event) => setFormState((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags (comma separated)" style={inputStyle} />
                <textarea value={formState.excerpt} onChange={(event) => setFormState((current) => ({ ...current, excerpt: event.target.value }))} placeholder="Short excerpt" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                <textarea value={formState.content} onChange={(event) => setFormState((current) => ({ ...current, content: event.target.value }))} placeholder="Write your article content here..." rows={8} style={{ ...inputStyle, resize: "vertical" }} />
                <ArticleCoverImageField value={formState.coverImageUrl} onChange={(coverImageUrl) => setFormState((current) => ({ ...current, coverImageUrl }))} />

                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <button disabled={isSubmitting} onClick={() => void submitMemberDraft()} className="btn-primary" style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? "Submitting..." : "Submit For Review"}
                  </button>
                  <button onClick={() => setShowMemberUpload(false)} className="btn-secondary" style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", background: "transparent" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PostCard({ post, index }: { post: any; index: number }) {
  return (
    <AnimatedCard index={index}>
      <Link href={`/education/${post.slug || post.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", overflow: "hidden", borderRadius: "8px 8px 0 0" }}>
          <img
            src={post.coverImageUrl}
            alt={post.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
            className="hover-scale"
          />
          <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {post.contentType}
          </div>
        </div>
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1, background: "rgba(15, 22, 40, 0.3)", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{post.knowledgeCategory}</p>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.8rem", lineHeight: 1.4 }} className="gradient-text">{post.title}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5, flex: 1 }}>{post.excerpt}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{post.authorName}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{formatDateStable(post.publishedAt)}</span>
            </div>
            <span style={{ color: "var(--gold)", fontSize: "0.85rem", fontWeight: 500 }}>Read More</span>
          </div>
        </div>
      </Link>
    </AnimatedCard>
  );
}
