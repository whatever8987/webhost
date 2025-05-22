import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { TabNavigation } from "@/components/layout/TabNavigation";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { RecentLeads } from "@/components/dashboard/RecentLeads";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await API.core.getStats();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TabNavigation />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardOverview stats={stats} />
          
          <div className="mt-8">
            <RecentLeads />
          </div>
        </div>
      </main>
    </div>
  );
}