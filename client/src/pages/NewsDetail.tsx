import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, X, CheckCircle2 } from "lucide-react";
import { API } from "@/lib/api";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Business } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function NewsDetailPage() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [showAdminBar, setShowAdminBar] = useState(true);
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  // Query to fetch specific business
  const { data: business, isLoading, error } = useQuery<Business>({
    queryKey: ["business", id],
    queryFn: async () => {
      try {
        const response = await API.iframe.getBusiness(id);
        return response.data;
      } catch (error) {
        console.error("Error loading business:", error);
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Mutation for claiming business
  const claimMutation = useMutation({
    mutationFn: async (businessId: number) => {
      const response = await API.iframe.claimBusiness(businessId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", id] });
      toast.success("Successfully claimed business!");
    },
    onError: (error) => {
      console.error("Error claiming business:", error);
      toast.error("Failed to claim business. Please try again later.");
    },
  });

  const handleClaim = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (business) {
      claimMutation.mutate(business.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNavigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNavigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "No results found"}
            </p>
            <Button onClick={() => navigate('/news')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavigation />
      
      {/* Admin Bar */}
      {showAdminBar && (
        <div className="bg-gray-800 text-white p-3 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center text-sm">
              <Button
                variant="link"
                className="text-white p-0 mr-4"
                onClick={() => navigate('/news')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <span>
                Viewing: <strong>{business.name}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {business.type && (
                <Badge variant="secondary" className="bg-gray-700 text-white">
                  {business.type.name}
                </Badge>
              )}
              {business.claimed ? (
                <Badge variant="secondary" className="bg-green-700 text-white">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Claimed
                </Badge>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleClaim}
                  disabled={claimMutation.isPending}
                >
                  {claimMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Claim Business
                </Button>
              )}
              {business.url && (
                <a
                  href={business.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  Visit Website
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                onClick={() => setShowAdminBar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Iframe */}
      <div className="flex-1 relative">
        {business.url && (
          <iframe
            src={business.url}
            className="absolute inset-0 w-full h-full border-0"
            title={business.name}
            loading="lazy"
          />
        )}
      </div>

      {/* Show Admin Bar Button */}
      {!showAdminBar && (
        <div className="fixed bottom-4 right-4 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="shadow-lg"
            onClick={() => setShowAdminBar(true)}
          >
            Show Info
          </Button>
        </div>
      )}
    </div>
  );
} 