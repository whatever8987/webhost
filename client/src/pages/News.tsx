import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { API } from "@/lib/api";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Business, TypeBusiness } from "@/lib/api/types";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NewsPage() {
  const [, navigate] = useLocation();

  // Query to fetch businesses grouped by type
  const { data: typeBusinesses, isLoading, error } = useQuery<TypeBusiness[]>({
    queryKey: ["typeBusinesses"],
    queryFn: async () => {
      try {
        const response = await API.iframe.getTypeBusinesses();
        return response.data;
      } catch (error) {
        console.error("Error loading businesses:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading businesses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <h1 className="text-2xl font-bold mb-2">Error Loading Businesses</h1>
        <p>We could not fetch the list of businesses. Please try again later.</p>
      </div>
    );
  }

  if (!typeBusinesses || typeBusinesses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">No Businesses Found</h1>
          <p className="text-muted-foreground">There are no businesses available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />

      <section className="relative py-12 md:py-20">
        <div className="absolute inset-0 bg-grid-slate-200/70 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">News & Updates</h1>
            <p className="mt-2 text-xl text-muted-foreground">
              Browse through our latest news and updates
            </p>
          </div>

          <div className="space-y-8">
            {typeBusinesses.map((typeBusiness) => (
              <div key={typeBusiness.type} className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">{typeBusiness.type}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {typeBusiness.businesses?.map((business: Business) => (
                    <Card key={business.id} className="overflow-hidden h-full flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="line-clamp-1">{business.name}</span>
                          {business.type && (
                            <Badge variant="secondary" className="shrink-0 ml-2">{business.type.name}</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {business.url && (
                            <a
                              href={business.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline line-clamp-1"
                            >
                              Visit Website
                            </a>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col">
                        <div className="space-y-4 flex-grow">
                          {business.image && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-md">
                              <img
                                src={business.image}
                                alt={business.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          {business.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {business.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{business.owner_username ? `Owner: ${business.owner_username}` : 'Unclaimed'}</span>
                            <Badge variant={business.claimed ? "default" : "outline"}>
                              {business.claimed ? 'Claimed' : 'Unclaimed'}
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full mt-auto"
                            onClick={() => navigate(`/news/${business.slug}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 