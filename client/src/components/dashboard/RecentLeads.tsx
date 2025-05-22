import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Salon } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function RecentLeads() {
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isContacting, setIsContacting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: leads, isLoading } = useQuery<Salon[]>({
    queryKey: ["/api/salons"],
  });

  const toggleSelectLead = (id: number) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (leads) {
      if (selectedLeads.length === leads.length) {
        setSelectedLeads([]);
      } else {
        setSelectedLeads(leads.map((lead) => lead.id));
      }
    }
  };

  const contactSelectedLeads = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to contact.",
        variant: "destructive",
      });
      return;
    }

    setIsContacting(true);
    try {
      await apiRequest("POST", "/api/contact-leads", { leadIds: selectedLeads });
      toast({
        title: "Success!",
        description: `${selectedLeads.length} lead(s) have been marked as contacted.`,
      });
      setSelectedLeads([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to contact leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsContacting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "notContacted":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Not Contacted
          </Badge>
        );
      case "contacted":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Contacted
          </Badge>
        );
      case "interested":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Interested
          </Badge>
        );
      case "subscribed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Subscribed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="mt-10">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Leads</h3>
          <p className="mt-1 text-sm text-gray-500">
            Track salon owners who might be interested in your service.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button
            onClick={contactSelectedLeads}
            disabled={selectedLeads.length === 0 || isContacting}
            className="inline-flex items-center"
          >
            <Mail className="mr-2 h-4 w-4" />
            Email Selected
          </Button>
        </div>
      </div>
      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <Checkbox
                      checked={
                        leads?.length
                          ? selectedLeads.length === leads.length
                          : false
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Salon
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Location
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Sample URL
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  Array(4)
                    .fill(0)
                    .map((_, index) => (
                      <tr key={index}>
                        <td colSpan={6} className="px-3 py-4">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                ) : leads && leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleSelectLead(lead.id)}
                          aria-label={`Select ${lead.name}`}
                        />
                      </td>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {lead.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {lead.location}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {getStatusBadge(lead.contactStatus || "notContacted")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-primary">
                        <Link href={`/demo/${lead.sampleUrl}`} className="hover:underline">
                          {lead.sampleUrl}
                        </Link>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Button
                          variant="link"
                          className="text-primary hover:text-primary-dark mr-2"
                          onClick={() => navigate(`/salon/edit/${lead.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="link"
                          className="text-primary hover:text-primary-dark"
                          onClick={() => navigate(`/salon/contact/${lead.id}`)}
                        >
                          Contact
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                      No leads found. Generate a sample site to create leads.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
