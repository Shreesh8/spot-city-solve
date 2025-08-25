import React, { useState } from "react";
import IssueMap from "@/components/maps/IssueMap";
import { useIssues, Issue } from "@/contexts/IssueContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import IssueDetail from "@/components/issues/IssueDetail";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

const Map = () => {
  const { user } = useAuth();
  const { issues } = useIssues();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId);

  const handleIssueSelect = (issueId: string) => {
    setSelectedIssueId(issueId);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="relative flex-grow">
        <IssueMap onIssueSelect={handleIssueSelect} />

        {selectedIssue && (
          <Sheet open={!!selectedIssueId} onOpenChange={() => setSelectedIssueId(null)}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Issue Details</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <IssueDetail issue={selectedIssue} />
              </div>
            </SheetContent>
          </Sheet>
        )}

        {user && (
          <div className="fixed right-4 bottom-4 md:hidden">
            <Link to="/report">
              <Button size="lg" className="h-14 w-14 rounded-full">
                <Plus className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;