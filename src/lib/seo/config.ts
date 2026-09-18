import type { OutputFormat } from "@/lib/compression/types";

export interface SeoPageConfig {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  keywords: string[];
  h1: string;
  subtitle: string;
  badge: string;
  mediaType: "image" | "video";
  targetKb?: string;
  targetMb?: number;
  format?: OutputFormat;
  useCases: Array<{ title: string; desc: string }>;
  faqs: Array<[string, string]>;
  relatedSlugs: string[];
}

export const SEO_PAGES: Record<string, SeoPageConfig> = {
  "compress-image": {
    slug: "compress-image",
    title: "Compress Image Online Free — Reduce Image Size Without Losing Quality",
    metaTitle: "Compress Image Online Free — Fast, Private, No Signup",
    description: "Compress images online for free without losing quality. Shrink JPG, PNG, WebP, and AVIF files. Batch compress up to 20 photos instantly. 100% private.",
    keywords: [
      "compress image", "reduce image size", "compress photo", "image size reducer",
      "compress image without losing quality", "bulk image compressor", "free image compressor no signup"
    ],
    h1: "Compress Images Online Without Losing Quality",
    subtitle: "Reduce file sizes of JPG, PNG, WebP, and AVIF photos in seconds. Set your exact target KB or choose smart presets. 100% private with no account required.",
    badge: "Smart Image Compressor",
    mediaType: "image",
    useCases: [
      { title: "Web & Blog Optimization", desc: "Speed up page loads by reducing image weight up to 80% while preserving crisp pixel fidelity." },
      { title: "Online Portals & Uploads", desc: "Easily meet strict upload size constraints on job portals, admission portals, and government sites." },
      { title: "Batch Photography", desc: "Compress up to 20 images at a time and download them together in a single ZIP archive." }
    ],
    faqs: [
      ["Does compressing reduce photo quality?", "Our advanced Sharp engine uses perceptual lossy and lossless algorithms to strip redundant metadata and optimize pixel data, keeping your images sharp and clear."],
      ["Is there any file limit?", "You can upload up to 20 images at once, with a generous 50 MB limit per individual file."],
      ["Are my images stored or saved?", "Never. Files are processed in memory and isolated temporary disk space, and automatically wiped after 30 minutes. You can also clear them anytime with one click."]
    ],
    relatedSlugs: ["compress-image-to-100kb", "compress-image-to-200kb", "compress-jpg-to-100kb", "compress-png-to-100kb"]
  },

  "compress-image-to-20kb": {
    slug: "compress-image-to-20kb",
    title: "Compress Image to 20KB Online — Perfect for Signatures & Badges",
    metaTitle: "Compress Image to 20KB Online Free (Signatures & Forms)",
    description: "Compress image or signature to 20KB online for government forms, job applications, and exam portals. Fast, free, and completely private.",
    keywords: [
      "compress image to 20kb", "signature image under 20kb", "compress photo to 20kb",
      "compress image for government form", "signature resize to 20kb"
    ],
    h1: "Compress Image & Signature to 20KB",
    subtitle: "Target exact 20 KB limit required by government exam portals, SSC, UPSC, and passport applications. Preserves sharp signature lines and photo clarity.",
    badge: "Target: 20 KB",
    mediaType: "image",
    targetKb: "20",
    useCases: [
      { title: "Digital Signatures", desc: "Ideal for government and university exam portals requiring signature images strictly between 10 KB and 20 KB." },
      { title: "Thumbnail Avatars", desc: "Create micro profile icons and badge photos that load instantly on low-bandwidth connections." }
    ],
    faqs: [
      ["How do I compress my signature to under 20KB?", "Upload your signature photo, select 20 KB target size, and click Compress. Sizvo Compressor will dial in the optimal dimensions and encoding automatically."],
      ["Will the text or signature become blurry?", "Our system balances resolution scaling and contrast preservation to ensure dark ink lines remain sharp and legible."]
    ],
    relatedSlugs: ["compress-image-to-50kb", "compress-image-to-100kb", "compress-jpg-to-100kb"]
  },

  "compress-image-to-50kb": {
    slug: "compress-image-to-50kb",
    title: "Compress Image to 50KB Online Free — Passport & Application Forms",
    metaTitle: "Compress Image to 50KB Online Free | Sizvo Compressor",
    description: "Compress image to 50KB online. Reduce photo size for exam forms, visa applications, and government portals without quality loss.",
    keywords: [
      "compress image to 50kb", "signature image under 50kb", "compress photo to 50kb",
      "passport photo under 50kb", "compress image for online form"
    ],
    h1: "Compress Image to 50KB Online",
    subtitle: "Automatically scale and optimize photos to under 50 KB. Ideal for passport photos, exam registration forms, and visa portals.",
    badge: "Target: 50 KB",
    mediaType: "image",
    targetKb: "50",
    useCases: [
      { title: "Visa & Passport Applications", desc: "Meets strict consular requirements for online visa filings where photos must not exceed 50 KB." },
      { title: "Exam Registration Portals", desc: "Fast compression for UPSC, GATE, JEE, and state civil service registration uploads." }
    ],
    faqs: [
      ["Can I compress both JPG and PNG to 50KB?", "Yes! You can compress any JPG, PNG, or WebP image directly down to 50 KB, or convert to JPEG for optimal file size."],
      ["What if my original photo is over 10MB?", "Sizvo Compressor accepts photos up to 50 MB and efficiently shrinks them down to your exact 50 KB target."]
    ],
    relatedSlugs: ["compress-image-to-20kb", "compress-image-to-100kb", "compress-image-to-200kb"]
  },

  "compress-image-to-100kb": {
    slug: "compress-image-to-100kb",
    title: "Compress Image to 100KB Online — Free Photo Size Reducer",
    metaTitle: "Compress Image to 100KB Online Free (Job & Exam Forms)",
    description: "Compress image to 100KB online for free. Reduce photo size to under 100KB for government forms, job applications, passport photos, and exams without quality loss.",
    keywords: [
      "compress image to 100kb", "compress photo to 100kb", "reduce image size to 100kb",
      "jpg compressor to 100kb", "photo under 100kb", "passport photo under 100kb",
      "compress image for online form", "compress image for application", "compress photo for exam form"
    ],
    h1: "Compress Image to 100KB Online",
    subtitle: "Shrink any photo or scan to under 100 KB in one click. Specially tuned for government portals, job applications, resumes, and university admissions.",
    badge: "Target: 100 KB",
    mediaType: "image",
    targetKb: "100",
    useCases: [
      { title: "Government & Exam Applications", desc: "Most official application forms strictly require photos under 100 KB. We hit the target accurately." },
      { title: "Job Applications & Resumes", desc: "Ensure your headshot or portfolio image fits attachment limits on company career portals." },
      { title: "Passport & ID Documents", desc: "Reduce ID card, passport, and driving license scans under 100 KB without blurry text." }
    ],
    faqs: [
      ["How does Sizvo Compressor guarantee image size under 100KB?", "Our compression engine runs an intelligent iterative optimization loop that tests encoding levels and dimensions until the file is guaranteed ≤ 100 KB."],
      ["Does it work with PNG files?", "Yes! You can compress PNGs directly or convert them to JPEG for even smaller sizes while preserving natural color tones."],
      ["Is this safe for sensitive ID cards or passports?", "Yes. Sizvo is private by design. Your files are automatically deleted after 30 minutes, never shared, and never used for training."]
    ],
    relatedSlugs: ["compress-image-to-200kb", "compress-image-to-50kb", "compress-jpg-to-100kb", "compress-png-to-100kb"]
  },

  "compress-image-to-200kb": {
    slug: "compress-image-to-200kb",
    title: "Compress Image to 200KB Online — High Quality Photo Compression",
    metaTitle: "Compress Image to 200KB Online Free | Sizvo Compressor",
    description: "Compress image to 200KB online. Reduce photo size to under 200KB for websites, forms, and email attachments while preserving sharp detail.",
    keywords: [
      "compress image to 200kb", "compress photo to 200kb", "reduce image size to 200kb",
      "jpg compressor to 200kb", "compress jpg to 200kb", "compress png to 200kb"
    ],
    h1: "Compress Image to 200KB Online",
    subtitle: "Get the ideal balance of crisp detail and light weight. Compress high-resolution camera photos down to under 200 KB effortlessly.",
    badge: "Target: 200 KB",
    mediaType: "image",
    targetKb: "200",
    useCases: [
      { title: "E-Commerce & Product Shots", desc: "Maintain sharp product details and textures on Shopify or Amazon while keeping page load speeds high." },
      { title: "Real Estate & Architecture", desc: "Compress property listing photos to 200 KB for rapid email distribution and fast client viewing." }
    ],
    faqs: [
      ["Why is 200KB the recommended size for web images?", "200 KB allows high-resolution photos (1920x1080 and above) to maintain near-flawless visual quality while downloading in milliseconds."],
      ["Can I compress multiple images to 200KB together?", "Yes! Drop up to 20 images at once and Sizvo Compressor will compress all of them to ≤ 200 KB simultaneously."]
    ],
    relatedSlugs: ["compress-image-to-100kb", "compress-image-to-500kb", "compress-jpg-to-100kb"]
  },

  "compress-image-to-500kb": {
    slug: "compress-image-to-500kb",
    title: "Compress Image to 500KB Online — Ultra-Crisp HD Compression",
    metaTitle: "Compress Image to 500KB Online Free | Sizvo Compressor",
    description: "Compress image to 500KB online. Shrink large 10MB+ DSLR camera and smartphone photos to 500KB with zero noticeable quality difference.",
    keywords: [
      "compress image to 500kb", "reduce image size to 500kb", "compress photo to 500kb",
      "shrink large photo", "compress dslr photo"
    ],
    h1: "Compress Image to 500KB Online",
    subtitle: "Turn giant 15MB smartphone and camera photos into light, shareable 500 KB images with pristine clarity.",
    badge: "Target: 500 KB",
    mediaType: "image",
    targetKb: "500",
    useCases: [
      { title: "Photography Portfolios", desc: "Showcase sharp creative work without bogging down your portfolio bandwidth or loading times." },
      { title: "Email Attachments", desc: "Easily send dozens of high-res photos via Gmail or Outlook without hitting attachment limits." }
    ],
    faqs: [
      ["Will 500KB maintain 4K resolution?", "In most cases, yes! High-efficiency JPEG and WebP encoding allow 4K images to look pristine even at 500 KB."]
    ],
    relatedSlugs: ["compress-image-to-200kb", "compress-image-to-100kb", "compress-image"]
  },

  "compress-jpg-to-100kb": {
    slug: "compress-jpg-to-100kb",
    title: "Compress JPG to 100KB Online — Free JPEG Size Reducer",
    metaTitle: "Compress JPG to 100KB Online Free | Sizvo Compressor",
    description: "Compress JPG to 100KB online for free. Reduce JPEG image file size to under 100KB for application forms, passports, and website uploads.",
    keywords: [
      "compress jpg to 100kb", "jpg compressor to 100kb", "compress jpeg to 100kb",
      "reduce jpg size to 100kb", "jpg size reducer", "compress photo to 100kb"
    ],
    h1: "Compress JPG to 100KB Online",
    subtitle: "Precision JPEG compression that targets exactly 100 KB while retaining smooth gradients and crisp edges.",
    badge: "JPG · Target 100 KB",
    mediaType: "image",
    targetKb: "100",
    format: "jpeg",
    useCases: [
      { title: "Official Form Uploads", desc: "Almost all government, academic, and banking portals specifically require JPG format under 100 KB." },
      { title: "Scanned Certificates", desc: "Compress birth certificates, transcripts, and diplomas to readable, lightweight JPG files." }
    ],
    faqs: [
      ["Does it convert other formats to JPG?", "Yes! You can upload PNG, WebP, or AVIF files and Sizvo Compressor will optimize and output a clean JPG file under 100 KB."]
    ],
    relatedSlugs: ["compress-png-to-100kb", "compress-image-to-100kb", "compress-image-to-50kb"]
  },

  "compress-png-to-100kb": {
    slug: "compress-png-to-100kb",
    title: "Compress PNG to 100KB Online — Shrink Transparent PNGs",
    metaTitle: "Compress PNG to 100KB Online Free | Sizvo Compressor",
    description: "Compress PNG to 100KB online. Reduce PNG file size while preserving alpha transparency and sharp vector graphics. Fast, free, and private.",
    keywords: [
      "compress png to 100kb", "png compressor to 100kb", "reduce png size to 100kb",
      "compress png without losing quality", "transparent png compressor", "shrink png"
    ],
    h1: "Compress PNG to 100KB Online",
    subtitle: "Compress heavy PNG screenshots, illustrations, and logos down to 100 KB while preserving transparent backgrounds.",
    badge: "PNG · Target 100 KB",
    mediaType: "image",
    targetKb: "100",
    format: "png",
    useCases: [
      { title: "Transparent Logos & Icons", desc: "Keep alpha transparency intact while drastically reducing asset load times on web and mobile apps." },
      { title: "UI Screenshots", desc: "Compress sharp interface screenshots without blurry font artifacts or muddy UI lines." }
    ],
    faqs: [
      ["Will transparency be preserved?", "Yes! PNG transparency is fully maintained throughout our compression process."],
      ["Can I convert PNG to JPG if I need even smaller sizes?", "Yes! You can easily switch the output format dropdown to JPEG if transparency is not required."]
    ],
    relatedSlugs: ["compress-jpg-to-100kb", "compress-image-to-100kb", "compress-image-to-200kb"]
  },

  "compress-video": {
    slug: "compress-video",
    title: "Compress Video Online Free — Reduce Video File Size Without Quality Loss",
    metaTitle: "Compress Video Online Free — Fast, Private MP4 Compressor",
    description: "Compress videos online for free. Reduce MP4, MOV, and WebM video size without losing quality. Set target MB or choose Discord, WhatsApp, and Email presets.",
    keywords: [
      "compress video", "video compressor online", "compress video online", "reduce video size",
      "reduce video file size", "video size reducer", "compress mp4", "mp4 compressor online",
      "compress video without losing quality"
    ],
    h1: "Compress Videos Online Free",
    subtitle: "Two-pass FFmpeg H.264 video compression that delivers drastically smaller MP4 files without blurry artifacts or out-of-sync audio.",
    badge: "Online Video Compressor",
    mediaType: "video",
    useCases: [
      { title: "Social Media & Chat Apps", desc: "Fit videos under strict upload and sharing caps for WhatsApp, Discord, Slack, and Telegram." },
      { title: "Email Attachments", desc: "Shrink smartphone 4K recordings down to 25 MB so they attach directly into Gmail and Outlook." },
      { title: "Website Video Backgrounds", desc: "Lighten self-hosted website videos so they stream instantly without buffering for visitors." }
    ],
    faqs: [
      ["Which video formats are supported?", "You can upload MP4, MOV (iPhone QuickTime), and WebM files up to 500 MB."],
      ["What is two-pass compression?", "Two-pass encoding analyzes the video dynamics on the first pass, then precisely allocates bitrates on the second pass for maximum sharpness at the smallest size."],
      ["Can I mute the video?", "Yes! Toggle 'Remove audio track' to mute the video and save even more file size."]
    ],
    relatedSlugs: ["compress-video-for-whatsapp", "compress-video-for-discord", "compress-video-to-25mb", "compress-video-to-8mb"]
  },

  "compress-video-to-8mb": {
    slug: "compress-video-to-8mb",
    title: "Compress Video to 8MB Online — Perfect for Discord Free Users",
    metaTitle: "Compress Video to 8MB Online (Discord Preset) | Sizvo Compressor",
    description: "Compress video to 8MB online for Discord free tier uploads. Shrink MP4 and MOV videos under 8MB with high quality. No watermark, no signup.",
    keywords: [
      "compress video to 8mb", "compress video under 8mb", "discord video compressor",
      "compress video for discord", "reduce video size to 8mb", "shrink mp4 to 8mb"
    ],
    h1: "Compress Video to 8MB Online",
    subtitle: "Specially tuned for Discord's free upload limit. Turn large gameplay clips and phone videos into crisp 8 MB MP4s in seconds.",
    badge: "Discord 8 MB Limit",
    mediaType: "video",
    targetMb: 8,
    useCases: [
      { title: "Discord Gaming Clips", desc: "Share high-FPS gaming highlights directly in Discord text channels without needing Nitro." },
      { title: "Quick Chat Uploads", desc: "Fast-loading video snippets tailored for low-bandwidth mobile networks." }
    ],
    faqs: [
      ["Does it guarantee the file will be under 8MB?", "Yes! Our two-pass encoder calculates the exact bitrate budget so the output never exceeds 8 MB."]
    ],
    relatedSlugs: ["compress-video-for-discord", "compress-video-to-16mb", "compress-video-for-whatsapp"]
  },

  "compress-video-to-16mb": {
    slug: "compress-video-to-16mb",
    title: "Compress Video to 16MB Online — WhatsApp File Limit Reducer",
    metaTitle: "Compress Video to 16MB Online (WhatsApp Limit) | Sizvo Compressor",
    description: "Compress video to 16MB online for WhatsApp. Reduce video file size to send full length videos on WhatsApp without compression errors.",
    keywords: [
      "compress video to 16mb", "compress video under 16mb", "whatsapp video compressor",
      "compress video for whatsapp", "reduce video size for whatsapp", "video too large for whatsapp"
    ],
    h1: "Compress Video to 16MB Online",
    subtitle: "Fit your video under WhatsApp's strict 16 MB direct media limit. Send full-length clips without WhatsApp rejecting the file.",
    badge: "WhatsApp 16 MB Limit",
    mediaType: "video",
    targetMb: 16,
    useCases: [
      { title: "WhatsApp Direct Sending", desc: "Prevent the dreaded 'Video is too large to send' error on WhatsApp chats and broadcast lists." },
      { title: "Mobile Messaging", desc: "Works seamlessly across iMessage, Telegram, and SMS MMS." }
    ],
    faqs: [
      ["Why does WhatsApp stop me from sending videos?", "WhatsApp has a strict 16 MB ceiling for direct inline video sharing. Sizvo Compressor shrinks your video to fit cleanly under this limit."]
    ],
    relatedSlugs: ["compress-video-for-whatsapp", "compress-video-to-25mb", "compress-video-to-8mb"]
  },

  "compress-video-to-25mb": {
    slug: "compress-video-to-25mb",
    title: "Compress Video to 25MB Online — Gmail & Outlook Email Attachment",
    metaTitle: "Compress Video to 25MB Online (Email Attachment) | Sizvo Compressor",
    description: "Compress video to 25MB online for email attachments. Shrink video files to send via Gmail, Outlook, Yahoo, and iCloud Mail without Google Drive links.",
    keywords: [
      "compress video to 25mb", "compress video under 25mb", "compress video for email",
      "compress video for gmail", "email video attachment size", "reduce email attachment size"
    ],
    h1: "Compress Video to 25MB for Email",
    subtitle: "Fit large videos into Gmail, Outlook, and Yahoo Mail attachments without needing cloud upload links.",
    badge: "Email 25 MB Limit",
    mediaType: "video",
    targetMb: 25,
    useCases: [
      { title: "Gmail & Outlook Attachments", desc: "Standard email providers reject files over 25 MB. We ensure your video attaches directly to the email body." },
      { title: "Client Deliverables", desc: "Send draft previews and video proofs straight to client inboxes without friction." }
    ],
    faqs: [
      ["Will the audio track remain synced?", "Yes! Two-pass FFmpeg maintains strict audio-video timestamps so lip sync and background sound remain perfectly aligned."]
    ],
    relatedSlugs: ["compress-video-for-email", "compress-video-to-16mb", "compress-video"]
  },

  "compress-video-for-whatsapp": {
    slug: "compress-video-for-whatsapp",
    title: "Compress Video for WhatsApp Online — Send Without Size Limit Errors",
    metaTitle: "Compress Video for WhatsApp Online Free | Sizvo Compressor",
    description: "Compress video for WhatsApp online. Reduce video size to under 16MB to send full length videos on WhatsApp without quality loss or errors.",
    keywords: [
      "compress video for whatsapp", "compress video to send on whatsapp", "reduce video size for whatsapp",
      "compress whatsapp video", "video too large for whatsapp", "compress video under whatsapp limit"
    ],
    h1: "Compress Video for WhatsApp",
    subtitle: "Tired of 'Video too large to send'? Compress phone recordings into crisp, WhatsApp-ready MP4s under 16 MB in seconds.",
    badge: "WhatsApp Optimized",
    mediaType: "video",
    targetMb: 16,
    useCases: [
      { title: "Family & Vacation Clips", desc: "Send full HD travel videos to family groups without waiting minutes for uploads." },
      { title: "Business Updates & Demos", desc: "Distribute product demos and marketing clips directly to WhatsApp business leads." }
    ],
    faqs: [
      ["How do I send long videos on WhatsApp?", "Upload your video to Sizvo Compressor, choose the 16 MB WhatsApp preset, and download the optimized MP4. It will send instantly on WhatsApp."]
    ],
    relatedSlugs: ["compress-video-to-16mb", "compress-video-for-discord", "compress-video-for-email"]
  },

  "compress-video-for-discord": {
    slug: "compress-video-for-discord",
    title: "Compress Video for Discord Online — Free 8MB & 25MB Presets",
    metaTitle: "Compress Video for Discord Online Free | Sizvo Compressor",
    description: "Compress video for Discord online. Shrink gameplay clips and screen recordings under the 8MB free limit or 25MB server limit with no quality loss.",
    keywords: [
      "compress video for discord", "discord video compressor", "compress video to 8mb",
      "compress video under 8mb", "shrink video for discord"
    ],
    h1: "Compress Video for Discord",
    subtitle: "Share your best gaming clutches, memes, and screen captures on Discord without paying for Nitro.",
    badge: "Discord Preset",
    mediaType: "video",
    targetMb: 8,
    useCases: [
      { title: "Gaming Highlights & Clutches", desc: "Convert 60 FPS gameplay captures into compact MP4s that play inline on Discord." },
      { title: "Bug Reports & Screencasts", desc: "Share developer bug reproductions and software walkthroughs in server support channels." }
    ],
    faqs: [
      ["Does Discord compress videos again?", "If your video is already under 8 MB, Discord displays it natively without additional re-encoding or degradation."]
    ],
    relatedSlugs: ["compress-video-to-8mb", "compress-video-for-whatsapp", "compress-video"]
  },

  "compress-video-for-email": {
    slug: "compress-video-for-email",
    title: "Compress Video for Email Online — Send Direct MP4 Attachments",
    metaTitle: "Compress Video for Email Online Free | Sizvo Compressor",
    description: "Compress video for email online. Reduce video size to under 25MB for Gmail, Outlook, Yahoo, and Apple Mail without sending Google Drive links.",
    keywords: [
      "compress video for email", "compress video for email attachment", "compress video for gmail",
      "reduce email attachment size", "email video compressor"
    ],
    h1: "Compress Video for Email Attachments",
    subtitle: "Say goodbye to annoying cloud drive share links. Compress your video to under 25 MB so it attaches directly to your email message.",
    badge: "Email Preset",
    mediaType: "video",
    targetMb: 25,
    useCases: [
      { title: "Job Applications & Video Resumes", desc: "Ensure hiring managers can view your video intro directly inside their mail client." },
      { title: "Customer Support Proofs", desc: "Send clear bug and defect demonstration videos directly to customer service desks." }
    ],
    faqs: [
      ["What is the maximum attachment limit for Gmail and Outlook?", "Both Gmail and Outlook enforce a maximum attachment limit of 25 MB. Our email preset targets 25 MB exactly."]
    ],
    relatedSlugs: ["compress-video-to-25mb", "compress-video-for-whatsapp", "compress-video"]
  }
};
