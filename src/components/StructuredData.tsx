import { useEffect } from 'react';

interface StructuredDataProps {
  data: object | object[];
}

export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
}