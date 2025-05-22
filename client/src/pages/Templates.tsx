import { TopNavigation } from "@/components/layout/TopNavigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Assuming you use Shadcn Input and other components imported from the SalonsPage example
// import { Input } from "@/components/ui/input"; // Not needed on Templates page
import { Loader2, PlusCircle, CheckCircle, EyeIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter"; // Import Link if using it for navigation
import { useState } from "react";
import { API } from "@/lib/api"; // Import our API client
import axios from "axios"; // For error handling

// Assuming you have a User type for the current user
import { User } from "@/lib/auth";

// Assuming your Template type is imported correctly from '@/lib/api/types'
// import { Template } from "@/lib/api/types";


// Helper function to safely parse features (unchanged)
const parseFeatures = (featuresString: string | any): string[] => {
  // Handle cases where features is not a string (e.g., null, undefined, object)
  if (typeof featuresString !== 'string') {
     // If it's already an array, map it, otherwise return empty
     // Assuming features JSONField default is dict, this part might not be hit unless data is malformed
     if (Array.isArray(featuresString)) {
         return featuresString.map((item: any) => item.feature || item.desc || 'Unnamed feature');
     }
     // If it's an object, try to extract values (common for boolean feature flags)
      if (typeof featuresString === 'object' && featuresString !== null) {
          // Example: Extract keys where value is true, or just keys
           return Object.keys(featuresString).filter(key => featuresString[key] === true);
          // Or return a list of feature names if the JSON is {'feature1': true, 'feature2': false}
           // return Object.keys(featuresString);
      }

     return [];
  }
  // If features are stored as a JSON string, parse it
  try {
    const parsed = JSON.parse(featuresString);
     if (Array.isArray(parsed)) {
         return parsed.map((item: any) => item.feature || item.desc || 'Unnamed feature');
     }
      if (typeof parsed === 'object' && parsed !== null) {
          // Example: Extract keys where value is true, or just keys
           return Object.keys(parsed).filter(key => parsed[key] === true);
      }
    return [];
  } catch {
    return [];
  }
};

// Assuming PaginatedResponse type is imported from "@/lib/api"
// import { PaginatedResponse } from "@/lib/api";


export default function TemplatesPage() { // Renamed component for clarity
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // --- Query 1: Fetch User Authentication Status ---
  // Fetch the current user to check if they are logged in and if they already own a salon.
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      // Only attempt to fetch user if there's potentially a token
      if (typeof window !== 'undefined' && !!localStorage.getItem('access_token')) {
        try {
          const response = await API.user.getProfile();
          return response.data; // Return user data if successful
        } catch (error: any) {
           // If getProfile returns 401, the API client interceptor should handle token cleanup and redirect.
           // For other errors, log and return null.
          if (error.response?.status !== 401) {
             console.error("Failed to fetch user profile on Templates page:", error);
          }
          return null; // Return null if fetching user failed
        }
      }
      return null; // Return null immediately if no token exists
    },
    // Enable this query ONLY if there might be a token
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false, // Don't retry on auth/fetch errors
    staleTime: 5 * 60 * 1000, // Keep user data fresh for 5 mins
  });

  // Determine if the user is logged in based on the user query result
  const isLoggedIn = !!user;
  // Check if the user already owns a salon (assuming user object has a 'salon' property or similar link)
  // Adjust 'user?.salon' based on your User model/serializer if the link is different (e.g., user.owned_salons?.length > 0)
  const userHasSalon = user?.salon !== null && user?.salon !== undefined;


  // --- Query 2: Fetch the list of templates ---
  const { data: templatesData, isLoading: isLoadingTemplates, error: templatesError } = useQuery<PaginatedResponse<Template>>({
    queryKey: ["templates"], // Key for this query
    queryFn: async () => {
      try {
        // Assuming API.templates.list() returns a paginated response like { results: [], count: N }
        const response = await API.templates.list();
        // Access the 'results' array from the paginated response
        return response.data.results || [];
      } catch (error) {
        console.error("Error loading templates:", error); // Log the actual error
        toast({
          title: "Error loading templates",
          description: "Could not fetch templates. Please try again later.",
          variant: "destructive"
        });
        throw error; // Re-throw to signal query failure
      }
    },
    enabled: true, // This query should always run to list templates
    retry: 1, // Retry template fetch once
    staleTime: 5 * 60 * 1000, // Cache templates for 5 minutes
    gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
  });


  // Safely handle templates data (use an empty array if data is not yet available or not an array)
  const templates = Array.isArray(templatesData) ? templatesData : [];


  // --- Handle Template Selection ---
  const handleTemplateSelect = (templateId: number) => {
    // **STEP 1: Check Authentication**
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to select a template and create your site.",
        variant: "info" // Changed variant for clarity
      });
      // **Redirect to Login:** Navigate to your login page
      // Pass the current location (templates page) as a redirect parameter
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${redirectUrl}`); // Navigate to your login route
      return; // Stop here if not logged in
    }

    // **STEP 2: Check if User Already Has a Salon**
    // This check prevents a user from selecting a template to create a *new* site
    // if they already own one.
    if (userHasSalon) {
         toast({
            title: "Already Have a Salon",
            description: "You can only have one salon. Manage your existing one from the dashboard.",
            variant: "info" // Use info variant
         });
         // Optionally navigate them to their existing salon's management page or dashboard
         navigate("/dashboard"); // Or navigate(`/portal?salonId=${user.salon.id}`) if your user object includes salon ID
         return; // Stop here if user already has a salon
    }

    // If authenticated and no existing salon, proceed with selection
    setSelectedTemplate(templateId);
    toast({
      title: "Template Selected",
      description: "Scroll down or click 'Continue' to proceed.", // Update description
      variant: "success"
    });
  };


  // --- Handle Template Preview ---
  const handleTemplatePreview = (templateId: number) => {
    // Find the template by ID to potentially get its sample_url (though not strictly needed for preview route)
    const template = templates.find(t => t.id === templateId);
    if (!template) {
        toast({
            title: "Error",
            description: "Template details not found for preview.",
            variant: "warning"
        });
        return;
    }

    // Navigate to the SampleSite component route configured for preview mode
    // Pass the template ID as a URL parameter
    // Assumes your frontend Wouter route is something like <Route path="/preview/template/:templateId" component={SampleSite} />
    const previewRoute = `/preview/template/${templateId}`; // Or whatever your preview route is
    window.open(previewRoute, '_blank'); // Open in a new tab

     // Optional: Show a toast indicating preview is opening
    toast({
        title: "Opening Preview",
        description: `Opening preview for "${template.name}" in a new tab.`,
        variant: "default"
    });
  };


  // --- Handle Continue Button Click ---
  const handleContinue = () => {
    // **STEP 1: Check if a template is selected**
    if (selectedTemplate === null) {
      toast({
        title: "Selection Required",
        description: "Please select a template before continuing.",
        variant: "destructive"
      });
      return; // Stop here if no template is selected
    }

     // **STEP 2: Check Authentication (Again - important if user session expires)**
    if (!isLoggedIn) {
        toast({
           title: "Login Required",
           description: "Please log in to create your site.",
           variant: "info"
        });
        // Redirect to Login, passing the current location + selected template ID as a redirect parameter
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search); // Captures /templates?templateId=...
        navigate(`/login?redirect=${redirectUrl}`); // Navigate to your login route
        return; // Stop here if not logged in
    }

    // **STEP 3: Check if User Already Has a Salon (Again - safety check)**
    if (userHasSalon) {
         toast({
            title: "Already Have a Salon",
            description: "You can only have one salon. Manage your existing one from the dashboard.",
            variant: "info"
         });
         navigate("/dashboard"); // Or navigate(`/portal?salonId=${user.salon.id}`)
         return; // Stop here
    }

    // If all checks pass, navigate to the salon creation flow
    // Pass the selected template ID to the creation page
    navigate(`/portal/create?templateId=${selectedTemplate}`);
  };


  // --- Render Loading and Error States ---

  // Show loader if templates are loading, OR if user is loading and a token exists
  // The user query check is only relevant here if you need user data (like userHasSalon)
  // to affect the initial render BEFORE templates load. If templates MUST load first
  // regardless of user status, you only need isLoadingTemplates here.
  // Let's just check isLoadingTemplates for simplicity for showing templates list.
  if (isLoadingTemplates) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <span className="ml-2 text-muted-foreground">Loading templates...</span>
       </div>
     );
   }

  // If templates failed to load entirely
   if (templatesError) {
       return (
            <div className="text-center py-12 text-red-500">
                <h1 className="text-2xl font-bold mb-2">Error Loading Templates</h1>
               <p>We could not fetch the list of templates. Please try again later.</p>
               {/* Add a retry button if you want */}
            </div>
       );
   }


  return (
    // Main container for the page
    <div className="min-h-screen bg-background">
      {/* Top navigation - Pass user data if needed, even if loading/error occurred */}
      <TopNavigation user={user} isLoggedIn={isLoggedIn} isLoadingUser={isLoadingUser} />

      {/* Page Content Section */}
      <section className="relative py-12 md:py-20">
         {/* Background pattern layer (optional) */}
        <div className="absolute inset-0 bg-grid-slate-200/70 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

        {/* Content layer - centered, padded, above background */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Choose Your Website Template</h1>
            <p className="mt-2 text-xl text-muted-foreground">
              Select from our professionally designed templates
            </p>
             {/* Message if user already has a salon */}
               {isLoggedIn && userHasSalon && (
                   <div className="mt-4 text-center text-sm text-muted-foreground italic">
                       You already have a salon linked to your account. You cannot create a new one.
                   </div>
               )}
          </div>


          {/* Templates Grid */}
          {templates.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {templates.map((template) => (
                  <Card key={template.id} className={`overflow-hidden transition-all duration-200 ${selectedTemplate === template.id ? 'ring-2 ring-primary scale-[1.02]' : ''} ${userHasSalon ? 'opacity-60 cursor-not-allowed' : ''}`}> {/* Reduce opacity if user has salon */}
                    <div className="relative aspect-video bg-gray-200">
                      <img
                        src={template.preview_image || '/placeholder-template.png'} // Use template preview image
                        alt={template.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-template.png'; // Fallback image
                          e.currentTarget.onerror = null;
                        }}
                        loading="lazy"
                      />
                       {/* Overlay for readability/hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent"></div>
                      {template.is_mobile_optimized && (
                        <Badge className="absolute top-2 right-2 bg-primary hover:bg-primary">
                          Mobile Ready
                        </Badge>
                      )}
                       {/* Preview Button Overlay */}
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/20">
                            <Button size="sm" onClick={() => handleTemplatePreview(template.id)} className="z-10">
                                <EyeIcon className="h-4 w-4 mr-2" />
                                Preview
                            </Button>
                       </div>
                    </div>
                    <CardHeader>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    {/* Render parsed features */}
                    {parseFeatures(template.features).length > 0 && (
                      <CardContent className="space-y-2">
                        {parseFeatures(template.features).map((feature, i) => (
                          <div key={i} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </CardContent>
                    )}
                    <CardFooter className="flex justify-between gap-2">
                       {/* Preview Button */}
                       <Button variant="outline" size="sm" onClick={() => handleTemplatePreview(template.id)}>
                         <EyeIcon className="h-4 w-4 mr-2" />
                         Preview
                       </Button>
                       {/* Select Button */}
                      <Button
                        size="sm"
                        onClick={() => handleTemplateSelect(template.id)}
                        variant={selectedTemplate === template.id ? "default" : "secondary"}
                        disabled={userHasSalon || isLoadingUser} // Disable if user already has a salon OR user status is loading
                      >
                        {isLoadingUser ? (
                             <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : userHasSalon ? (
                             <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Salon Linked {/* Indicate user has a salon */}
                             </>
                        ) : selectedTemplate === template.id ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Selected
                          </>
                        ) : (
                          <>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Select
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Continue Button (only shows if logged in AND has a template selected AND doesn't already have a salon) */}
              {isLoggedIn && selectedTemplate !== null && !userHasSalon && (
                <div className="mt-10 flex justify-center">
                  <Button size="lg" onClick={handleContinue}>
                    Continue to Create Your Salon
                  </Button>
                </div>
              )}
               {/* Message/Prompt below the grid if needed */}
                {!isLoggedIn && (
                     <div className="mt-10 text-center text-muted-foreground">
                         Log in to select a template and create your salon website.
                          <Link href="/login" className="text-primary hover:underline ml-1">Log In</Link>
                     </div>
                )}


            </>
          ) : (
            // Empty state (no templates loaded)
            <div className="text-center py-12 text-muted-foreground">
              No templates available at the moment.
            </div>
          )}
        </div>
      </section>

       {/* Optional: Add a footer */}
       {/* <footer className="bg-slate-900 text-slate-300 py-8 text-center">...</footer> */}
    </div>
  );
}