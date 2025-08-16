import { useSeoMeta } from '@unhead/react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video.other' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  siteName?: string;
  locale?: string;
  alternateUrls?: { url: string; hreflang: string }[];
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  videoData?: {
    duration?: string;
    uploadDate?: string;
    thumbnailUrl?: string;
    embedUrl?: string;
  };
}

export function useSEO(props: SEOProps) {
  const {
    title,
    description,
    keywords = [],
    image = `${window.location.origin}/og-image.png`,
    url = window.location.href,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    siteName = 'Vlogstr',
    locale = 'en_US',
    alternateUrls = [],
    canonicalUrl,
    noIndex = false,
    noFollow = false,
    videoData,
  } = props;

  // Ensure title includes site name for branding
  const fullTitle = title.includes('Vlogstr') ? title : `${title} | Vlogstr`;
  
  // Core meta tags
  const metaTags: Record<string, string> = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    
    // Open Graph
    'og:title': fullTitle,
    'og:description': description,
    'og:image': image,
    'og:url': url,
    'og:type': type,
    'og:site_name': siteName,
    'og:locale': locale,
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': fullTitle,
    'twitter:description': description,
    'twitter:image': image,
    'twitter:site': '@vlogstr',
    
    // Additional meta
    'theme-color': '#000000',
    'application-name': siteName,
    'apple-mobile-web-app-title': siteName,
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  };

  // Canonical URL
  if (canonicalUrl) {
    metaTags['link:canonical'] = canonicalUrl;
  }

  // Robots meta
  if (noIndex || noFollow) {
    const robotsContent: string[] = [];
    if (noIndex) robotsContent.push('noindex');
    if (noFollow) robotsContent.push('nofollow');
    metaTags['robots'] = robotsContent.join(', ');
  }

  // Article-specific meta
  if (type === 'article' || type === 'video.other') {
    if (publishedTime) metaTags['article:published_time'] = publishedTime;
    if (modifiedTime) metaTags['article:modified_time'] = modifiedTime;
    if (author) metaTags['article:author'] = author;
  }

  // Video-specific meta
  if (type === 'video.other' && videoData) {
    if (videoData.duration) metaTags['video:duration'] = videoData.duration;
    if (videoData.uploadDate) metaTags['video:release_date'] = videoData.uploadDate;
    if (videoData.thumbnailUrl) metaTags['og:image'] = videoData.thumbnailUrl;
    if (videoData.embedUrl) metaTags['og:video'] = videoData.embedUrl;
  }

  // Alternate language URLs
  alternateUrls.forEach(({ url, hreflang }) => {
    metaTags[`link:alternate:${hreflang}`] = url;
  });

  useSeoMeta(metaTags);

  // Return structured data for JSON-LD
  return {
    generateWebsiteSchema: () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: window.location.origin,
      description: 'A decentralized video platform built on the Nostr protocol',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${window.location.origin}/discover?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
    
    generateOrganizationSchema: () => ({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: window.location.origin,
      description: 'A decentralized video platform built on the Nostr protocol',
      sameAs: [],
    }),
    
    generateVideoSchema: (videoData: {
      title: string;
      description?: string;
      uploadDate?: string;
      duration?: string;
      thumbnailUrl?: string;
      embedUrl?: string;
      authorName: string;
    }) => ({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: videoData.title,
      description: videoData.description || description,
      uploadDate: videoData.uploadDate,
      duration: videoData.duration,
      thumbnailUrl: videoData.thumbnailUrl,
      embedUrl: videoData.embedUrl,
      author: {
        '@type': 'Person',
        name: videoData.authorName,
      },
    }),
    
    generateBreadcrumbSchema: (items: Array<{ name: string; url: string }>) => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }),
  };
}