import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await API.auth.getCurrentUser();
        return response.data;
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    isAdmin: user?.role === "admin",
  };
} 