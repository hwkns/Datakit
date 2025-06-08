import { Helmet } from 'react-helmet-async'
import image from '@/assets/datakit.png';
interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  siteName?: string
}

export const SEO: React.FC<SEOProps> = ({
    title = 'DataKit',
    description = 'Data Toolkit',
    keywords = 'data, visualization, sql',
    url = window.location.href,
    type = 'website',
    siteName = 'DataKit, analyze your data'
  }) => {
    const fullTitle = `${title} | Analyze your data`
  
    return (
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content={type} />
        <meta property="og:site_name" content={siteName} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        
        {/* Additional SEO Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Your Name" />
        <link rel="canonical" href={url} />
      </Helmet>
    )
  }