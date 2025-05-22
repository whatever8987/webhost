// src/components/SalonTemplate.tsx
import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Menu, X, Facebook, Instagram, Twitter } from 'lucide-react';
// Assuming this is your shadcn/ui Button component
import { Button } from "@/components/ui/button";

// --- Frontend Type Definitions for data passed to the template ---
// These should match the structure of the `Salon` and `Template` objects
// that are fetched from your backend API, especially the preview endpoint.

interface Service {
  name: string;
  price: string;
  description?: string | null;
}

interface Testimonial {
  name: string;
  quote: string;
  rating?: number | null;
}

interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  // Add other platforms if supported
}

interface SalonDataForTemplate {
  id?: number; // Optional, might not be present in preview data
  name: string;
  sample_url?: string | null; // Optional, might not be present in preview
  logo_image?: string | null; // Using logo_image as per your Salon type
  cover_image?: string | null;
  hero_subtitle?: string | null;
  opening_hours?: string[] | null; // Assuming array of strings
  phone_number?: string | null;
  address?: string | null;
  location?: string | null;
  email?: string | null;
  description?: string | null;
  about_image?: string | null;
  services?: Service[] | null; // Assuming array of Service objects
  services_url?: string | null;
  gallery_images?: string[] | null; // Assuming array of image URLs
  testimonials?: Testimonial[] | null; // Assuming array of Testimonial objects
  booking_url?: string | null;
  map_embed_url?: string | null;
  footer_logo_image?: string | null; // Using footer_logo_image
  social_links?: SocialLinks | null; // Using the SocialLinks interface
  // Add any other fields your template uses (e.g., hero_tagline, footer_about, etc.)
}

interface TemplateDataForTemplate {
  id?: number; // Optional
  name?: string | null; // Optional
  slug?: string | null; // Optional, useful for debugging
  preview_image?: string | null; // Optional

 


  features?: {
    show_gallery?: boolean;
    show_testimonials?: boolean;
    // Add other feature flags
  } | null; // Make features optional and potentially null

  // Add any other template fields used for styling or logic
}

interface SalonTemplateProps {
  salon: SalonDataForTemplate; // Use the specific data type for the template
  template: TemplateDataForTemplate; // Use the specific data type for the template
  isPreview?: boolean; // Flag passed from SampleSite
}

const SalonTemplate: React.FC<SalonTemplateProps> = ({ salon, template }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper function to apply template styles as CSS variables
  const applyTemplateStyles = {
    fontFamily: template?.font_family || "'Poppins', sans-serif", // Fallback to Poppins or other standard font
    '--primary-color': template?.primary_color || '#7E69AB',
    '--secondary-color': template?.secondary_color || '#D6BCFA',
    '--background-color': template?.background_color || '#f9f7f5',
    '--text-color': template?.text_color || '#1A1F2C',
    // Add other style variables as needed
  } as React.CSSProperties;

  // Helper to safely open URLs
  const openUrl = (url?: string | null, fallbackUrl: string = '#') => {
    const targetUrl = url && url !== '#' ? url : fallbackUrl;
     if (targetUrl === '#') return; // Don't navigate if still a hash fallback

    try {
        // Simple check if it looks like an external URL
        if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
            window.open(targetUrl, "_blank", "noopener,noreferrer");
        } else {
            // Assume it's an internal hash link or path
             window.location.href = targetUrl; // Or navigate using router if preferred
        }
    } catch (e) {
        console.error("Failed to navigate to URL:", targetUrl, e);
        // Optionally show a toast error
    }
  };


  return (
    // Apply overall styles to the root element
    <div className="font-sans leading-relaxed text-gray-800" style={applyTemplateStyles}> {/* Using font-sans utility */}
      {/* --- Header Section --- */}
      <header
        className="relative px-6 py-4 md:py-6 md:px-10 flex justify-between items-center shadow-md"
        style={{ backgroundColor: 'var(--primary-color)' }} // Use CSS variable
      >
        {/* Logo */}
        <div className="flex-shrink-0">
          <img
            src={salon.logo_image || 'placeholder-logo.png'} // Fallback logo
            alt={`${salon.name || 'Salon'} Logo`}
            className="h-auto max-h-16" // Adjust max-h as needed
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {/* Ensure links are robust, checking if the target section exists */}
          {["Home", "About", "Services", "Gallery", "Testimonials", "Contact"].map((item) => {
              // Dynamically decide if a link should appear based on salon data/template features
              const sectionId = item.toLowerCase();
              const showSection =
                (sectionId === 'home') || // Home is always there
                (sectionId === 'about' && salon.description && salon.about_image) || // Need description and image for about
                (sectionId === 'services' && Array.isArray(salon.services) && salon.services.length > 0) || // Need services data
                (sectionId === 'gallery' && template?.features?.show_gallery && Array.isArray(salon.gallery_images) && salon.gallery_images.length > 0) || // Need feature flag AND images
                (sectionId === 'testimonials' && template?.features?.show_testimonials && Array.isArray(salon.testimonials) && salon.testimonials.length > 0) || // Need feature flag AND testimonials
                (sectionId === 'contact' && (salon.address || salon.phone_number || salon.email || salon.map_embed_url)); // Need some contact info
                
               if (!showSection) return null; // Don't render the link if the section won't be shown

              return (
                <a
                  key={item}
                  href={`#${sectionId}`}
                  className="font-medium text-white hover:text-opacity-80 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
                >
                  {item}
                </a>
             );
          })}
        </nav>

        {/* Book Appointment Button (Desktop) */}
        {salon.booking_url && (
            <div className="hidden md:block flex-shrink-0">
              <Button
                className="border-2 px-6 py-2 rounded-sm hover:bg-white/10 transition-colors duration-200"
                style={{
                  borderColor: 'var(--secondary-color)', // Use CSS variable
                  color: "white"
                }}
                onClick={() => openUrl(salon.booking_url)} // Use helper function
              >
                Book Appointment
              </Button>
            </div>
        )}


        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white flex-shrink-0"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <Menu size={24} />
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col p-6">
            <div className="flex justify-end mb-8">
              <button
                className="text-white"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close mobile menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col items-center justify-center space-y-6 flex-1">
               {/* Re-use the same logic for mobile links */}
               {["Home", "About", "Services", "Gallery", "Testimonials", "Contact"].map((item) => {
                    const sectionId = item.toLowerCase();
                    const showSection =
                       (sectionId === 'home') ||
                       (sectionId === 'about' && salon.description && salon.about_image) ||
                       (sectionId === 'services' && Array.isArray(salon.services) && salon.services.length > 0) ||
                       (sectionId === 'gallery' && template?.features?.show_gallery && Array.isArray(salon.gallery_images) && salon.gallery_images.length > 0) ||
                       (sectionId === 'testimonials' && template?.features?.show_testimonials && Array.isArray(salon.testimonials) && salon.testimonials.length > 0) ||
                       (sectionId === 'contact' && (salon.address || salon.phone_number || salon.email || salon.map_embed_url));

                    if (!showSection) return null;

                   return (
                      <a
                        key={item}
                        href={`#${sectionId}`}
                        className="text-2xl font-medium text-white"
                        onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                      >
                        {item}
                      </a>
                  );
               })}
               {salon.booking_url && (
                  <Button
                    className="mt-8 border-2 px-6 py-2 rounded-sm hover:bg-white/10 transition-colors duration-200"
                    style={{
                      borderColor: 'var(--secondary-color)',
                      color: "white"
                    }}
                    onClick={() => {
                       openUrl(salon.booking_url);
                       setIsMobileMenuOpen(false); // Close menu on click
                    }}
                  >
                    Book Appointment
                  </Button>
               )}
            </nav>
          </div>
        )}
      </header>

      {/* --- Hero Section --- */}
      <section
        id="home"
        className="relative h-[70vh] md:h-[80vh] flex items-center"
        style={{
          backgroundImage: `url(${salon.cover_image || template?.default_cover_image || 'placeholder-cover.jpg'})`, // Fallback images
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white' // Ensure text is readable on the background
        }}
      >
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          aria-hidden="true"
        ></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {salon.name || 'Your Salon'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              {salon.hero_subtitle || 'Welcome to our salon!'}
            </p>
            {salon.booking_url && (
                <Button
                  className="px-8 py-3 text-lg rounded-sm hover:bg-opacity-90 transition-colors duration-200"
                   style={{
                    backgroundColor: 'var(--secondary-color)',
                    color: "white" // Or a color that contrasts well with secondary
                  }}
                  onClick={() => openUrl(salon.booking_url)}
                >
                  Book Your Visit
                </Button>
            )}
          </div>
        </div>
      </section>

      {/* --- Info Section (Strip) --- */}
       {/* Only show if there's at least one piece of info to display */}
       {(Array.isArray(salon.opening_hours) && salon.opening_hours.length > 0) || salon.phone_number || (salon.address && salon.location) ? (
            <section
              className="py-8 md:py-10"
              style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }} // Use CSS variables
            >
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Hours */}
                   {Array.isArray(salon.opening_hours) && salon.opening_hours.length > 0 && (
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          <Clock size={24} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Opening Hours</h3>
                          <ul>
                            {salon.opening_hours.map((hours, index) => (
                              <li key={index}>{hours}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                   )}

                  {/* Phone */}
                   {salon.phone_number && (
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          <Phone size={24} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Call Us</h3>
                          <a
                            href={`tel:${salon.phone_number}`}
                            className="hover:underline"
                          >
                            {salon.phone_number}
                          </a>
                        </div>
                      </div>
                   )}


                  {/* Address */}
                   {(salon.address || salon.location) && (
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          <MapPin size={24} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Find Us</h3>
                          <address style={{ fontStyle: 'normal' }}>
                            {salon.address && <>{salon.address}<br /></>}
                            {salon.location}
                          </address>
                        </div>
                      </div>
                   )}
                </div>
              </div>
            </section>
        ) : null}


      {/* --- About Section --- */}
      {salon.description || salon.about_image ? ( // Only show if there's content
        <section id="about" className="py-16 md:py-24" style={{ color: 'var(--text-color)' }}>
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Image */}
              {salon.about_image && (
                 <div className="order-2 md:order-1">
                   <div className="relative">
                     <div
                       className="absolute inset-0 -translate-x-4 -translate-y-4 border-2 z-0"
                       style={{ borderColor: 'var(--secondary-color)' }} // Use CSS variable
                       aria-hidden="true"
                     ></div>
                     <img
                       src={salon.about_image || template?.default_about_image || 'placeholder-about.jpg'} // Fallback
                       alt="Salon interior"
                       className="w-full h-auto relative z-10 shadow-lg object-cover object-center"
                       style={{ aspectRatio: '3 / 2' }} // Maintain aspect ratio
                     />
                   </div>
                 </div>
              )}


              {/* Text */}
              {salon.description && (
                  <div className={`order-1 md:order-2 ${!salon.about_image ? 'md:col-span-2 text-center' : ''}`}> {/* Center text if no image */}
                    <h2
                      className="text-3xl md:text-4xl font-bold mb-6"
                      style={{ color: 'var(--primary-color)' }} // Use CSS variable
                    >
                      About Us
                    </h2>
                    <div
                      className="prose prose-lg max-w-none space-y-4" // prose styles for paragraphs
                    >
                      {salon.description.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                   {salon.hero_subtitle && !salon.description && ( // Display subtitle if no description
                        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                          {salon.hero_subtitle}
                        </p>
                   )}
                  </div>
              )}
            </div>
          </div>
        </section>
      ) : null}


      {/* --- Services Section --- */}
      {Array.isArray(salon.services) && salon.services.length > 0 ? ( // Only show if services exist
        <section
          id="services"
          className="py-16 md:py-24"
          style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }} // Use CSS variables
        >
          <div className="container mx-auto px-6">
            <h2
              className="text-3xl md:text-4xl font-bold mb-12 text-center"
              style={{ color: 'var(--primary-color)' }} // Use CSS variable
            >
              Our Services
            </h2>

            {/* Optional Tagline */}
            {salon.services_tagline && (
                 <p className="text-center text-lg mb-10 text-muted-foreground">{salon.services_tagline}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {salon.services.map((service, index) => (
                <div
                  key={index}
                  className="p-6 border shadow-sm bg-white"
                  style={{ borderColor: 'var(--secondary-color)' }} // Use CSS variable
                >
                  <div className="flex justify-between items-baseline mb-3">
                    <h3
                      className="font-semibold text-xl"
                      style={{ color: 'var(--text-color)' }} // Use CSS variable
                    >
                      {service.name}
                    </h3>
                    <span
                      className="font-medium"
                      style={{ color: 'var(--primary-color)' }} // Use CSS variable
                    >
                      {service.price}
                    </span>
                  </div>
                  {service.description && (
                    <p
                      className="text-sm text-muted-foreground" // Use muted-foreground utility
                    >
                      {service.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {salon.services_url && (
              <div className="mt-12 text-center">
                <Button
                  className="px-6 py-2 rounded-sm hover:bg-opacity-90 transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--primary-color)', // Use CSS variable
                    color: "white"
                  }}
                   onClick={() => openUrl(salon.services_url)} // Use helper function
                >
                  View Full Service Menu
                </Button>
              </div>
            )}
          </div>
        </section>
      ) : null}


      {/* --- Gallery Section (Conditional) --- */}
      {template?.features?.show_gallery && Array.isArray(salon.gallery_images) && salon.gallery_images.length > 0 ? ( // Only show if enabled AND data exists
        <section id="gallery" className="py-16 md:py-24" style={{ color: 'var(--text-color)' }}>
          <div className="container mx-auto px-6">
            <h2
              className="text-3xl md:text-4xl font-bold mb-12 text-center"
              style={{ color: 'var(--primary-color)' }} // Use CSS variable
            >
              Our Work
            </h2>
             {/* Optional Tagline */}
            {salon.gallery_tagline && (
                 <p className="text-center text-lg mb-10 text-muted-foreground">{salon.gallery_tagline}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {salon.gallery_images.map((image, index) => (
                <div key={index} className="overflow-hidden shadow-md rounded-md"> {/* Added rounded-md */}
                  <img
                    src={image}
                    alt={`Salon work ${index + 1}`}
                    className="w-full h-64 object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
             {salon.gallery_url && (
              <div className="mt-12 text-center">
                <Button
                  variant="outline" // Use outline variant
                  className="px-6 py-2 rounded-sm hover:opacity-90 transition-colors duration-200"
                   style={{
                    borderColor: 'var(--primary-color)', // Use CSS variable
                    color: 'var(--primary-color)' // Use CSS variable
                  }}
                   onClick={() => openUrl(salon.gallery_url)} // Use helper function
                >
                  View Full Gallery
                </Button>
              </div>
            )}
          </div>
        </section>
      ) : null}


      {/* --- Testimonials Section (Conditional) --- */}
      {template?.features?.show_testimonials && Array.isArray(salon.testimonials) && salon.testimonials.length > 0 ? ( // Only show if enabled AND data exists
        <section
          id="testimonials"
          className="py-16 md:py-24"
          style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }} // Use CSS variables
        >
          <div className="container mx-auto px-6">
            <h2
              className="text-3xl md:text-4xl font-bold mb-12 text-center"
              style={{ color: 'var(--primary-color)' }} // Use CSS variable
            >
              What Clients Are Saying
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {salon.testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white p-6 shadow-sm border rounded-md" // Added rounded-md
                  style={{ borderColor: 'var(--secondary-color)' }} // Use CSS variable
                >
                  <div
                    className="mb-4 text-2xl italic" // Added italic for quotes
                    style={{ color: 'var(--secondary-color)' }} // Use CSS variable
                  >
                    "
                  </div>
                  <p
                    className="mb-4 text-muted-foreground" // Use muted-foreground utility
                  >
                    {testimonial.quote}
                  </p>
                  <div className="flex justify-end">
                    <p
                      className="font-medium"
                      style={{ color: 'var(--primary-color)' }} // Use CSS variable
                    >
                      — {testimonial.name}
                    </p>
                  </div>
                   {/* Optional Rating stars */}
                   {/* {typeof testimonial.rating === 'number' && !isNaN(testimonial.rating) && (
                       <div className="flex items-center justify-end mt-2">
                           {[...Array(5)].map((_, i) => (
                               <svg
                                   key={i}
                                   className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                   fill="currentColor"
                                   viewBox="0 0 20 20"
                               >
                                   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.803 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.803-2.034a1 1 0 00-1.175 0l-2.803 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                               </svg>
                           ))}
                       </div>
                   )} */}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}


      {/* --- Contact Section --- */}
      {(salon.address || salon.phone_number || salon.email || Array.isArray(salon.opening_hours) && salon.opening_hours.length > 0 || salon.map_embed_url) ? ( // Only show if contact info exists
        <section id="contact" className="py-16 md:py-24" style={{ color: 'var(--text-color)' }}>
          <div className="container mx-auto px-6">
            <h2
              className="text-3xl md:text-4xl font-bold mb-12 text-center"
              style={{ color: 'var(--primary-color)' }} // Use CSS variable
            >
              Contact Us
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div>
                <div className="space-y-6">
                  {/* Address */}
                   {(salon.address || salon.location) && (
                     <div className="flex items-start space-x-4">
                       <div className="mt-1">
                         <MapPin size={20} style={{ color: 'var(--primary-color)' }} />
                       </div>
                       <div>
                         <h3 className="font-semibold mb-1">Address</h3>
                         <address style={{ fontStyle: 'normal' }}>
                           {salon.address && <>{salon.address}<br /></>}
                           {salon.location}
                         </address>
                       </div>
                     </div>
                   )}

                  {/* Phone */}
                  {salon.phone_number && (
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        <Phone size={20} style={{ color: 'var(--primary-color)' }} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Phone</h3>
                        <a
                          href={`tel:${salon.phone_number}`}
                          className="hover:underline"
                        >
                          {salon.phone_number}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {salon.email && (
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        <Mail size={20} style={{ color: 'var(--primary-color)' }} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <a
                          href={`mailto:${salon.email}`}
                          className="hover:underline"
                        >
                          {salon.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Hours */}
                   {Array.isArray(salon.opening_hours) && salon.opening_hours.length > 0 && (
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          <Clock size={20} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Hours</h3>
                          <ul>
                            {salon.opening_hours.map((hours, index) => (
                              <li key={index}>{hours}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                   )}
                </div>

                {salon.booking_url && (
                  <div className="mt-8">
                    <Button
                      className="px-6 py-3 rounded-sm hover:bg-opacity-90 transition-colors duration-200"
                      style={{
                        backgroundColor: 'var(--primary-color)', // Use CSS variable
                        color: "white"
                      }}
                       onClick={() => openUrl(salon.booking_url)} // Use helper function
                    >
                      Book an Appointment
                    </Button>
                  </div>
                )}
              </div>

              {/* Map */}
              {salon.map_embed_url && (
                <div className="h-96 border rounded-md overflow-hidden" style={{ borderColor: 'var(--secondary-color)' }}> {/* Added rounded-md */}
                  <iframe
                    src={salon.map_embed_url}
                    width="100%"
                    height="100%"
                    style={{border: 0}}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Salon location map"
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}


      {/* --- Footer --- */}
       {/* Only show if there's any footer content */}
       {(salon.footer_logo_image || salon.logo_image || salon.name || salon.address || salon.phone_number || salon.email || salon.social_links) ? (
          <footer style={{ backgroundColor: 'var(--primary-color)', color: "white" }}>
            <div className="container mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Logo & Info */}
                <div>
                   {(salon.footer_logo_image || salon.logo_image) && (
                      <img
                        src={salon.footer_logo_image || salon.logo_image} // Use footer logo or main logo
                        alt={`${salon.name || 'Salon'} Logo`}
                        className="h-16 mb-4"
                      />
                   )}
                   {salon.footer_about && ( // Added footer_about from your Salon type
                       <p className="mb-4 text-sm opacity-90">
                           {salon.footer_about}
                       </p>
                   )}
                    {/* Fallback text if no footer_about */}
                   {(!salon.footer_about && (salon.description)) && (
                        <p className="mb-4 text-sm opacity-90">
                           {/* Display first paragraph of description or a default */}
                           {salon.description.split('\n\n')[0] || 'Your premier destination for beauty services.'}
                        </p>
                   )}
                </div>

                {/* Quick Links - Basic example, customize as needed */}
                <div>
                   <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
                   <ul className="space-y-2">
                      {/* Filter links based on section visibility, similar to header */}
                      {["Home", "About", "Services", "Gallery", "Testimonials", "Contact"].map((item) => {
                            const sectionId = item.toLowerCase();
                            const showSection =
                               (sectionId === 'home') ||
                               (sectionId === 'about' && salon.description && salon.about_image) ||
                               (sectionId === 'services' && Array.isArray(salon.services) && salon.services.length > 0) ||
                               (sectionId === 'gallery' && template?.features?.show_gallery && Array.isArray(salon.gallery_images) && salon.gallery_images.length > 0) ||
                               (sectionId === 'testimonials' && template?.features?.show_testimonials && Array.isArray(salon.testimonials) && salon.testimonials.length > 0) ||
                               (sectionId === 'contact' && (salon.address || salon.phone_number || salon.email || salon.map_embed_url));

                           if (!showSection) return null;

                         return (
                           <li key={item}>
                             <a
                               href={`#${sectionId}`}
                               className="opacity-90 hover:opacity-100 hover:underline"
                             >
                               {item}
                             </a>
                           </li>
                         );
                      })}
                   </ul>
                </div>

                {/* Contact & Social */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Connect With Us</h3>
                  {/* Display contact info in footer if available */}
                   {(salon.address || salon.location || salon.phone_number || salon.email) && (
                      <address className="not-italic mb-4 opacity-90">
                        {salon.address && <>{salon.address}<br /></>}
                        {salon.location && <>{salon.location}<br /></>}
                        {salon.phone_number && <>{salon.phone_number}<br /></>}
                        {salon.email && <>{salon.email}</>}
                      </address>
                   )}


                  {/* Social Icons */}
                  {salon.social_links && (
                    <div className="flex space-x-4">
                      {salon.social_links.facebook && (
                        <a
                          href={salon.social_links.facebook}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:opacity-80"
                           aria-label="Facebook"
                        >
                          <Facebook size={20} />
                        </a>
                      )}
                      {salon.social_links.instagram && (
                        <a
                          href={salon.social_links.instagram}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:opacity-80"
                           aria-label="Instagram"
                        >
                          <Instagram size={20} />
                        </a>
                      )}
                      {salon.social_links.twitter && (
                        <a
                          href={salon.social_links.twitter}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:opacity-80"
                           aria-label="Twitter"
                        >
                          <Twitter size={20} />
                        </a>
                      )}
                      {/* Add other social links here */}
                    </div>
                  )}
                </div>
              </div>

              {/* Copyright */}
              <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm opacity-80">
                © {new Date().getFullYear()} {salon.name || 'Salon Name'}. All rights reserved.
                 {/* Optional: Add link to your site/platform */}
                 {/* <span className="ml-2"> | Powered by <a href="YOUR_PLATFORM_URL" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">Your Platform Name</a></span> */}
              </div>
            </div>
          </footer>
       ) : null}

    </div>
  );
}

export default SalonTemplate;