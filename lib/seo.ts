import type { SeminarWithDetails, SessionWithDetails } from '@/types'

export function generateSeminarJsonLd(
  seminar: SeminarWithDetails,
  baseUrl: string
) {
  const sessions = seminar.sessions || []
  
  const events = sessions.map((session) => ({
    '@type': 'Event',
    name: seminar.title,
    description: seminar.description,
    image: seminar.imageUrl || `${baseUrl}/opengraph-image.png`,
    startDate: session.startAt,
    endDate: session.endAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: getAttendanceMode(session.format),
    location: getLocation(session),
    organizer: {
      '@type': 'Organization',
      name: process.env.NEXT_PUBLIC_COMPANY_NAME || '株式会社サンプル',
      url: baseUrl,
    },
    offers: session.ticketTypes?.map((ticket) => ({
      '@type': 'Offer',
      name: ticket.name,
      price: ticket.price,
      priceCurrency: 'JPY',
      availability: ticket.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      validFrom: new Date().toISOString(),
      url: `${baseUrl}/seminars/${seminar.slug}`,
    })) || [],
    performer: {
      '@type': 'Person',
      name: seminar.instructorName || process.env.NEXT_PUBLIC_COMPANY_NAME,
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@graph': events,
  }
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateOrganizationJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || '株式会社サンプル',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+81-3-1234-5678',
      contactType: 'customer support',
      availableLanguage: ['Japanese', 'English'],
    },
    sameAs: [
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
      process.env.NEXT_PUBLIC_TWITTER_URL,
      process.env.NEXT_PUBLIC_LINKEDIN_URL,
    ].filter(Boolean),
  }
}

export function generateWebSiteJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'セミナー管理システム',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/seminars?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

function getAttendanceMode(format: string) {
  switch (format) {
    case 'ONLINE':
      return 'https://schema.org/OnlineEventAttendanceMode'
    case 'HYBRID':
      return 'https://schema.org/MixedEventAttendanceMode'
    case 'OFFLINE':
    default:
      return 'https://schema.org/OfflineEventAttendanceMode'
  }
}

function getLocation(session: SessionWithDetails) {
  if (session.format === 'ONLINE') {
    return {
      '@type': 'VirtualLocation',
      url: session.onlineUrl || '',
    }
  }

  return {
    '@type': 'Place',
    name: session.venue || '',
    address: {
      '@type': 'PostalAddress',
      streetAddress: session.venueAddress || '',
      addressCountry: 'JP',
    },
  }
}

export function generateMetaTags({
  title,
  description,
  image,
  url,
  type = 'website',
}: {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
  const defaultImage = `${baseUrl}/opengraph-image.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: url || baseUrl,
      siteName: 'セミナー管理システム',
      images: [
        {
          url: image || defaultImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ja_JP',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image || defaultImage],
    },
  }
}

