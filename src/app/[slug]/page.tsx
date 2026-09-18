import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Layers3, ShieldCheck, Sparkles, UploadCloud, Zap } from "lucide-react";
import { SEO_PAGES } from "@/lib/seo/config";
import { MediaCompressor } from "@/components/media-compressor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(SEO_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = SEO_PAGES[slug];
  if (!config) return {};

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${baseUrl}/${config.slug}`;

  return {
    title: config.metaTitle,
    description: config.description,
    keywords: config.keywords,
    alternates: {
      canonical: pageUrl
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: pageUrl,
      type: "website",
      siteName: "Sizvo"
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description
    }
  };
}

export default async function SeoLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const config = SEO_PAGES[slug];
  if (!config) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Structured Data (JSON-LD) for Google Search Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": config.title,
        "url": `${baseUrl}/${config.slug}`,
        "description": config.description,
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": config.faqs.map(([question, answer]) => ({
          "@type": "Question",
          "name": question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": answer
          }
        }))
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="seo-breadcrumb" aria-label="Breadcrumb">
        <div className="seo-container">
          <Link href="/">Home</Link>
          <ChevronRight size={14} />
          <span>{config.mediaType === "image" ? "Image Compressor" : "Video Compressor"}</span>
          <ChevronRight size={14} />
          <span className="current">{config.badge}</span>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="seo-hero">
        <div className="seo-container">
          <div className="seo-hero-badge">
            <Sparkles size={14} /> {config.badge}
          </div>
          <h1>{config.h1}</h1>
          <p className="seo-hero-subtitle">{config.subtitle}</p>

          <div className="seo-trust-chips">
            <span><CheckCircle2 size={16} /> 100% Free & No Watermark</span>
            <span><ShieldCheck size={16} /> Private & Auto-Deleted</span>
            <span><Zap size={16} /> No Account Required</span>
          </div>
        </div>
      </section>

      {/* Interactive Compressor with Pre-filled Targets */}
      <section className="compressor-section seo-compressor-section">
        <div className="seo-container">
          <MediaCompressor
            initialMedia={config.mediaType}
            initialTargetKb={config.targetKb}
            initialFormat={config.format}
            initialTargetMb={config.targetMb}
          />
        </div>
      </section>

      {/* Use Cases & Problem Solvers */}
      {config.useCases.length > 0 && (
        <section className="seo-usecases-section">
          <div className="seo-container">
            <div className="section-intro">
              <span className="eyebrow">Practical Use Cases</span>
              <h2>Built for real applications</h2>
              <p>Solve strict file limit requirements without trial and error.</p>
            </div>
            <div className="seo-usecase-grid">
              {config.useCases.map((uc) => (
                <article key={uc.title} className="seo-usecase-card">
                  <span className="usecase-icon"><CheckCircle2 size={22} /></span>
                  <h3>{uc.title}</h3>
                  <p>{uc.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3 Step Guide */}
      <section className="steps-section seo-steps-section">
        <div className="seo-container">
          <div className="section-intro">
            <span className="eyebrow">Quick Guide</span>
            <h2>How to {config.h1.toLowerCase()}</h2>
          </div>
          <div className="steps-grid">
            <article>
              <i>01</i>
              <UploadCloud size={24} />
              <h3>Upload your file</h3>
              <p>Drag and drop your {config.mediaType} or click to select from your device.</p>
            </article>
            <article>
              <i>02</i>
              <Sparkles size={24} />
              <h3>Target is pre-set</h3>
              <p>We automatically applied optimal settings ({config.badge}). Adjust anytime if needed.</p>
            </article>
            <article>
              <i>03</i>
              <Layers3 size={24} />
              <h3>Download instantly</h3>
              <p>Grab your compressed {config.mediaType} immediately. Zero waiting time.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Related Tools (Internal Linking Matrix) */}
      {config.relatedSlugs.length > 0 && (
        <section className="seo-related-section">
          <div className="seo-container">
            <div className="section-intro">
              <span className="eyebrow">Related Tools</span>
              <h2>Explore other target sizes</h2>
            </div>
            <div className="seo-related-grid">
              {config.relatedSlugs.map((relSlug) => {
                const relConfig = SEO_PAGES[relSlug];
                if (!relConfig) return null;
                return (
                  <Link key={relSlug} href={`/${relSlug}`} className="seo-related-card">
                    <div>
                      <strong>{relConfig.h1}</strong>
                      <span>{relConfig.badge}</span>
                    </div>
                    <ArrowRight size={18} />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Frequently Asked Questions */}
      {config.faqs.length > 0 && (
        <section className="faq-section seo-faq-section">
          <div className="seo-container">
            <div className="section-intro">
              <span className="eyebrow"><HelpCircle size={15} /> FAQ</span>
              <h2>Frequently Asked Questions</h2>
            </div>
            <div className="faq-list">
              {config.faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <span>+</span>
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
