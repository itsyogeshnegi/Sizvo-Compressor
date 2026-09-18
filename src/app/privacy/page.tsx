import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <article className="legal-page"><h1>Privacy, plainly.</h1><p className="updated">Last updated: September 18, 2026</p><div className="legal-content">
    <h2>Files you upload</h2><p>Your images and videos are used only to perform the compression you request. They are stored in an isolated temporary job and automatically deleted within 30 minutes. Choosing “Clear all” requests deletion immediately.</p>
    <h2>Account information</h2><p>Google sign-in is optional. If you use it, Firebase Authentication provides your basic identity such as your name, email address, and profile photo. Sizvo does not store that information in its own database.</p>
    <h2>Technical information</h2><p>The service may process short-lived network and error information needed to protect the service, enforce request limits, and diagnose failures. Compression files are not used for advertising or model training.</p>
    <h2>Your choices</h2><p>You can use compression without signing in, remove a temporary job using “Clear all,” and sign out at any time. Avoid uploading anything you do not have permission to process.</p>
    <h2>Contact</h2><p>Before public launch, replace this paragraph with the operator&apos;s legal name and support email address.</p>
  </div></article>;
}
