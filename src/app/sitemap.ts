import type { MetadataRoute } from "next";
import { SEO_PAGES } from "@/lib/seo/config";
import { getBaseUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3
    }
  ];

  for (const slug of Object.keys(SEO_PAGES)) {
    routes.push({
      url: `${baseUrl}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85
    });
  }

  return routes;
}
