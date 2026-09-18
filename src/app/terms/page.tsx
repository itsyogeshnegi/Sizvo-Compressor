import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return <article className="legal-page"><h1>Terms of use.</h1><p className="updated">Last updated: September 18, 2026</p><div className="legal-content">
    <h2>Using Sizvo Compressor</h2><p>You may use Sizvo Compressor to process images and videos you own or have permission to use. Do not upload unlawful, harmful, or infringing material, probe the service, bypass limits, or disrupt other users.</p>
    <h2>Temporary processing</h2><p>Uploads and results are temporary and are scheduled for deletion within 30 minutes. You are responsible for downloading anything you want to keep. Sizvo Compressor is not a backup or permanent storage service.</p>
    <h2>Service availability</h2><p>The service is provided as available. Compression may change image quality, dimensions, metadata, or format according to your selected settings. Review outputs before relying on them.</p>
    <h2>Accounts</h2><p>Google sign-in is optional. You are responsible for activity associated with your identity and for keeping access to your Google account secure.</p>
    <h2>Before launch</h2><p>These starter terms are product copy, not legal advice. The service operator should review them, add its legal identity and jurisdiction, and obtain professional advice before a public launch.</p>
  </div></article>;
}
