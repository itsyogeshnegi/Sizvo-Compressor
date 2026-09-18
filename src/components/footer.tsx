import Link from "next/link";
import { ImageDown, LockKeyhole, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-directory">
        <div className="footer-col footer-col-brand">
          <Link href="/" className="footer-brand-logo">
            <ImageDown size={22} />
            <span>Sizvo</span>
          </Link>
          <p className="footer-brand-desc">
            Sizvo Compressor — Make Files Smaller. Privacy-first image and video compressor. Shrink JPG, PNG, WebP, AVIF, and MP4 files to exact KB and MB limits with zero quality loss.
          </p>
          <div className="footer-trust-badge">
            <LockKeyhole size={14} /> Auto-deleted after 30 minutes
          </div>
        </div>

        <div className="footer-col">
          <h4>Image Tools</h4>
          <ul>
            <li><Link href="/compress-image">Compress Image (Free)</Link></li>
            <li><Link href="/compress-image-to-20kb">Compress Image to 20KB</Link></li>
            <li><Link href="/compress-image-to-50kb">Compress Image to 50KB</Link></li>
            <li><Link href="/compress-image-to-100kb">Compress Image to 100KB</Link></li>
            <li><Link href="/compress-image-to-200kb">Compress Image to 200KB</Link></li>
            <li><Link href="/compress-image-to-500kb">Compress Image to 500KB</Link></li>
            <li><Link href="/compress-jpg-to-100kb">Compress JPG to 100KB</Link></li>
            <li><Link href="/compress-png-to-100kb">Compress PNG to 100KB</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Video Tools</h4>
          <ul>
            <li><Link href="/compress-video">Compress Video (Free)</Link></li>
            <li><Link href="/compress-video-to-8mb">Compress Video to 8MB</Link></li>
            <li><Link href="/compress-video-to-16mb">Compress Video to 16MB</Link></li>
            <li><Link href="/compress-video-to-25mb">Compress Video to 25MB</Link></li>
            <li><Link href="/compress-video-for-whatsapp">Video for WhatsApp</Link></li>
            <li><Link href="/compress-video-for-discord">Video for Discord</Link></li>
            <li><Link href="/compress-video-for-email">Video for Email</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Company & Legal</h4>
          <ul>
            <li><Link href="/#how-it-works">How It Works</Link></li>
            <li><Link href="/#faq">FAQ</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/login">Sign In</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-inner">
          <div className="footer-copy">
            © {new Date().getFullYear()} Sizvo Compressor. Make Files Smaller. 100% private, free online media compression.
          </div>
          <div className="footer-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
