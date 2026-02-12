import Script from 'next/script';

export default function JsonLd() {
    const organizationLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": "https://www.ecomoving.cl/#organization",
        "name": "Ecomoving",
        "url": "https://www.ecomoving.cl",
        "logo": {
            "@type": "ImageObject",
            "url": "https://www.ecomoving.cl/logo.png",
            "width": "512",
            "height": "512"
        },
        "description": "Líderes en regalos corporativos premium, merchandising ecológico y artículos publicitarios personalizados en Chile.",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+5694241xxxx", // Reemplazar con el número real cuando esté disponible
            "contactType": "sales",
            "areaServed": "CL",
            "availableLanguage": "Spanish"
        },
        "sameAs": [
            "https://www.instagram.com/ecomoving.cl",
            "https://www.linkedin.com/company/ecomoving"
        ]
    };

    const localBusinessLd = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "@id": "https://www.ecomoving.cl/#localbusiness",
        "name": "Ecomoving - Regalos Corporativos Premium",
        "image": "https://www.ecomoving.cl/hero-image.jpg",
        "priceRange": "$$$",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Santiago",
            "addressLocality": "Santiago",
            "addressRegion": "Región Metropolitana",
            "postalCode": "8320000",
            "addressCountry": "CL"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": -33.4489,
            "longitude": -70.6693
        },
        "url": "https://www.ecomoving.cl",
        "telephone": "+5694241xxxx",
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "18:30"
            }
        ]
    };

    const servicesLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Regalos Corporativos Premium",
                "description": "Curaduría exclusiva de artículos promocionales de alta gama."
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Merchandising Ecológico",
                "description": "Productos sustentables y biodegradables para marcas responsables."
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": "Personalización con Grabado Láser",
                "description": "Técnicas de personalización de alta precisión en metal, madera y más."
            }
        ]
    };

    return (
        <>
            <Script
                id="json-ld-org"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
            />
            <Script
                id="json-ld-local"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
            />
            <Script
                id="json-ld-services"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesLd) }}
            />
        </>
    );
}
