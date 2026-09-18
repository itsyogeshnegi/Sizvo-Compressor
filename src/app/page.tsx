import { CheckCircle2, Eye, Gauge, Layers3, ShieldCheck, Sparkles, UploadCloud, Zap } from "lucide-react";
import { MediaCompressor } from "@/components/media-compressor";
import { HeroComparison } from "@/components/hero-comparison";

const features = [
  { icon: Gauge, title: "Your size, your way", text: "Pick a simple preset or enter the exact size you need. Sizvo handles the technical details." },
  { icon: Eye, title: "Quality you can see", text: "Clear before-and-after details mean you always know what changed before downloading." },
  { icon: ShieldCheck, title: "Private by default", text: "Files live only long enough to process and download, then disappear automatically." }
];

const faqs = [
  ["Is Sizvo Compressor free to use?", "Yes. The compressor works without an account and supports batches of up to 20 images."],
  ["Are my images private?", "Yes. Files are isolated in a temporary job and automatically deleted after 30 minutes. You can also clear them immediately."],
  ["Which formats are supported?", "Images support JPEG, PNG, WebP, and AVIF. Videos accept MP4, MOV, and WebM and produce a widely compatible MP4."],
  ["Will compression reduce image dimensions?", "Normal presets preserve dimensions unless you set a maximum. Target Size only reduces dimensions if quality changes alone cannot reach your target."],
  ["Why did my image not get smaller?", "Some images are already highly optimized. Sizvo warns you rather than pretending that a larger output is a saving."],
  ["Do I need to sign in?", "No. Google sign-in is optional and does not change access to compression in this first release."]
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-badge"><Sparkles size={14} /> Sizvo Compressor — Make Files Smaller</span>
            <h1>Make Files Smaller.<br /><span>Fast, private, loss-free.</span></h1>
            <p>Compress, resize, and convert images and videos with instant Sharp™ and FFmpeg processing. No quality loss, zero wait times, and 100% private.</p>

            <div className="hero-actions">
              <a href="#compressor" className="button button-primary hero-btn-main">
                <Zap size={16} /> Start Compressing Free
              </a>
              <a href="#how-it-works" className="button button-secondary hero-btn-sub">
                How it works
              </a>
            </div>

            <div className="hero-points">
              <span><CheckCircle2 size={16} /> No account needed</span>
              <span><CheckCircle2 size={16} /> Batch up to 20 images</span>
              <span><CheckCircle2 size={16} /> Instant local privacy</span>
            </div>
          </div>

          <div className="hero-visual">
            <HeroComparison />
          </div>
        </div>
      </section>

      <div id="compressor" className="compressor-section"><MediaCompressor /></div>

      <section className="features-section">
        <div className="section-intro"><span className="eyebrow">Made for real life</span><h2>Smaller files, zero guesswork</h2><p>Everything you need to get the right result—nothing you don&apos;t.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon size={23} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section id="how-it-works" className="steps-section">
        <div className="section-intro"><span className="eyebrow">How it works</span><h2>Done in three small steps</h2></div>
        <div className="steps-grid">
          <article><i>01</i><UploadCloud size={24} /><h3>Drop your file</h3><p>Choose the Images or Videos tab, then drag in the file you want to shrink.</p></article>
          <article><i>02</i><Sparkles size={24} /><h3>Pick your result</h3><p>Balanced works beautifully, or choose your own target and format.</p></article>
          <article><i>03</i><Layers3 size={24} /><h3>Download and go</h3><p>Grab files one by one or download the whole batch as a ZIP.</p></article>
        </div>
      </section>

      <section id="faq" className="faq-section">
        <div className="section-intro"><span className="eyebrow">Good to know</span><h2>Questions, answered</h2></div>
        <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>
    </>
  );
}
