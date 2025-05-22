import { TopNavigation } from "@/components/layout/TopNavigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, EyeIcon, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"; // Added ArrowLeft, ArrowRight icons
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { API, PaginatedResponse, Salon } from "@/lib/api";
import axios from "axios";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

// Removed parseFeaturesOrServices as it was not used in this file.

export default function SalonsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // --- State for Search ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // --- State for Pagination ---
  const [offset, setOffset] = useState(0); // Start at the beginning (offset 0)
  const limit = 24; // Number of items per page (matches API call limit)


  // --- Debounce Logic ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // IMPORTANT: Reset offset to 0 when the search term changes
      setOffset(0);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);


  // Fetch user profile (needed for TopNavigation and checking login status/admin role)
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await API.user.getProfile();
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
           console.warn("Attempted to fetch user on salons page with invalid token (401). Global interceptor will handle logout.");
        } else {
           console.error("Error fetching user profile:", error);
        }
        return null;
      }
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isLoggedIn = !!user;

  // --- Fetch the list of salons ---
  // Include the debouncedSearchTerm AND offset in the query key
  const { data: salonsData, isLoading: isLoadingSalons, error: salonsError } = useQuery<PaginatedResponse<Salon>>({
    queryKey: ["salons", debouncedSearchTerm, offset], // Query key now includes search term and offset
    queryFn: async () => {
      try {
        // Pass the debounced search term AND offset to the API
        const response = await API.salons.list({
             limit: limit, // Use the defined limit
             offset: offset, // Use the current offset state
             search: debouncedSearchTerm
        });
        return response.data;
      } catch (error) {
        console.error("Error loading salons:", error);
        toast({
          title: t("common.error_loading_salons_title", "Error Loading Salons"),
          description: t("common.error_loading_salons_description", "Could not fetch salons. Please try again later."),
          variant: "destructive"
        });
        throw error;
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 60 * 1000,
  });

  // Handle loading state for both user (needed for TopNav) and salons
   // Show loader if user is loading AND a token exists, OR if salons are loading
  if (isLoadingUser && typeof window !== 'undefined' && !!localStorage.getItem('access_token') || isLoadingSalons) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">{t("common.loading", "Loading")}...</span>
      </div>
    );
  }

  const salons = salonsData?.results || [];
  const totalCount = salonsData?.count || 0; // Get total count from pagination data
  const hasSalonsError = !!salonsError;
  const hasNextPage = salonsData?.next !== null; // Check if 'next' URL is provided
  const hasPreviousPage = salonsData?.previous !== null; // Check if 'previous' URL is provided


  // --- Pagination Handlers ---
  const handleNextPage = () => {
    if (hasNextPage) {
      setOffset(offset + limit); // Increase offset by the limit
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      // Decrease offset by the limit, but don't go below 0
      setOffset(Math.max(0, offset - limit));
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <TopNavigation user={user} isLoggedIn={isLoggedIn} />

      {/* --- Section with Background Pattern --- */}
      <section className="relative py-12 md:py-20"> {/* Added vertical padding */}

         {/* --- The absolute background layer --- */}
         <div className="absolute inset-0 bg-grid-slate-200/70 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

         {/* --- The content layer - centered, padded, and above the background --- */}
         {/* Added relative z-10 to ensure content is above the absolute background */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

           {/* Page Header and Search Input */}
           <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900">{t("salons.title", "Browse Salons")}</h1>
              <p className="mt-2 text-xl text-muted-foreground">{t("salons.subtitle", "Find a salon site to view")}</p>

              <div className="mt-6 max-w-sm mx-auto">
                 <Input
                   type="text"
                   placeholder={t("salons.search_placeholder", "Search by name or location...")}
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full"
                 />
              </div>
           </div>

            {/* Display error message if fetching salons failed */}
            {hasSalonsError && (
                <div className="text-center text-red-500 p-8">
                   <p>{t("common.error_loading_salons_description", "Could not load salons.")}</p>
                </div>
            )}

           {/* Salons Grid */}
           {!hasSalonsError && (salons.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
               {salons.map((salon) => (
                 <Card key={salon.id} className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                   <CardHeader className="relative pb-0">
                       <div className="relative aspect-video bg-gray-200 overflow-hidden rounded-md">
                           {/* Use salon image first, then template preview */}
                           <img
                                src={salon.image || salon.template?.preview_image || '/placeholder-template.png'}
                                alt={`${salon.name || 'Salon'} preview`}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                    e.currentTarget.src = '/placeholder-template.png';
                                    e.currentTarget.onerror = null;
                                }}
                                loading="lazy"
                           />
                           {/* Overlay for hover preview link */}
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/30">
                                {salon.sample_url ? (
                                    <Link to={`/salons/sample/${salon.sample_url}`} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" className="z-10">
                                            <EyeIcon className="h-4 w-4 mr-2" />
                                            {t("common.preview", "Preview")}
                                        </Button>
                                    </Link>
                                ) : (
                                     <span className="text-white text-sm">{t("salons.no_preview", "No preview available")}</span>
                                )}
                           </div>
                       </div>

                       <div className="mt-4">
                           <CardTitle className="text-lg font-bold mb-1">{salon.name || 'Unnamed Salon'}</CardTitle>
                           <CardDescription className="text-sm text-muted-foreground">{salon.location || 'Location not specified'}</CardDescription>
                       </div>

                       {salon.claimed && (
                         <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" /> {t("salons.claimed", "Claimed")}
                         </Badge>
                       )}
                   </CardHeader>

                   <CardFooter className="pt-4 flex justify-end">
                     {salon.sample_url ? (
                       <Link to={`/salons/sample/${salon.sample_url}`} target="_blank" rel="noopener noreferrer">
                         <Button variant="outline" size="sm">
                           <EyeIcon className="h-4 w-4 mr-2" />
                           {t("salons.view_sample", "View Sample Site")}
                         </Button>
                       </Link>
                     ) : (
                            <Button variant="outline" size="sm" disabled>
                              {t("salons.sample_coming_soon", "Sample Coming Soon")}
                            </Button>
                       )}
                   </CardFooter>
                 </Card>
               ))}
             </div>
           ) : (
             <div className="text-center py-12 text-muted-foreground">
               {debouncedSearchTerm ? t("salons.no_search_results", "No salons found matching your search.") : t("salons.no_salons_found", "No salons available at the moment.")}
             </div>
           ))}

            {/* --- Pagination Controls --- */}
             {/* Only show controls if there are salons AND more than one page */}
            {!hasSalonsError && totalCount > limit && (
                <div className="mt-8 flex justify-center items-center space-x-4">
                    <Button
                        onClick={handlePreviousPage}
                        disabled={!hasPreviousPage || isLoadingSalons} // Disable if no previous page or currently loading
                        variant="outline"
                        size="sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t("common.previous", "Previous")}
                    </Button>

                    {/* Optional: Add page number display (requires calculating page from offset/limit) */}
                    {/* <span className="text-sm text-muted-foreground">
                         Page {Math.floor(offset / limit) + 1} of {Math.ceil(totalCount / limit)}
                    </span> */}
                     {/* Or display showing items */}
                     <span className="text-sm text-muted-foreground">
                         {t("salons.showing_items", "Showing {{start}}-{{end}} of {{total}}", {
                            start: offset + 1,
                            end: Math.min(offset + limit, totalCount),
                            total: totalCount,
                         })}
                     </span>


                    <Button
                        onClick={handleNextPage}
                        disabled={!hasNextPage || isLoadingSalons} // Disable if no next page or currently loading
                        variant="outline"
                        size="sm"
                    >
                        {t("common.next", "Next")}
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            )}
             {/* --- End Pagination Controls --- */}


         </div>
      </section>
      {/* --- End Section with Background Pattern --- */}


       {/* Optional: Add a footer outside the styled section if you want */}
       {/* <footer className="bg-slate-900 text-slate-300 py-8 text-center">...</footer> */}

    </div>
  );
}