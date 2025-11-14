
import React, { useState } from "react";
import { useIssues } from "@/contexts/IssueContext";
import { useAuth } from "@/contexts/AuthContext";
import IssueCard from "@/components/issues/IssueCard";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueStatus, Issue } from "@/contexts/IssueContext";
import { Plus } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const MyReports = () => {
  const { issues } = useIssues();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  const userIssues = issues.filter((issue) => issue.reporterId === user.id);
  
  const getFilteredIssues = (status: IssueStatus) => {
    return userIssues.filter((issue) => issue.status === status);
  };

  const openIssues = getFilteredIssues("open");
  const inProgressIssues = getFilteredIssues("in_progress");
  const resolvedIssues = getFilteredIssues("resolved");

  // Pagination helper
  const getPaginatedIssues = (issues: Issue[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return issues.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  const renderPagination = (totalItems: number, page: number, onPageChange: (page: number) => void) => {
    const totalPages = getTotalPages(totalItems);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Reports</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all the issues you've reported
          </p>
        </div>
        <Link to="/report">
          <Button className="hidden sm:flex">
            <Plus className="mr-2 h-4 w-4" />
            Report New Issue
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" onValueChange={() => setCurrentPage(1)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({userIssues.length})</TabsTrigger>
          <TabsTrigger value="open">
            Open ({openIssues.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressIssues.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedIssues.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {userIssues.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPaginatedIssues(userIssues, currentPage).map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
              {renderPagination(userIssues.length, currentPage, setCurrentPage)}
            </>
          ) : (
            <div className="text-center p-8">
              <h3 className="text-lg font-medium mb-2">No issues found</h3>
              <p className="text-muted-foreground mb-4">
                You haven't reported any issues yet
              </p>
              <Link to="/report">
                <Button>Report your first issue</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="open">
          {openIssues.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPaginatedIssues(openIssues, currentPage).map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
              {renderPagination(openIssues.length, currentPage, setCurrentPage)}
            </>
          ) : (
            <p className="text-center text-muted-foreground p-8">
              No open issues found
            </p>
          )}
        </TabsContent>

        <TabsContent value="in_progress">
          {inProgressIssues.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPaginatedIssues(inProgressIssues, currentPage).map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
              {renderPagination(inProgressIssues.length, currentPage, setCurrentPage)}
            </>
          ) : (
            <p className="text-center text-muted-foreground p-8">
              No issues in progress
            </p>
          )}
        </TabsContent>

        <TabsContent value="resolved">
          {resolvedIssues.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPaginatedIssues(resolvedIssues, currentPage).map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
              {renderPagination(resolvedIssues.length, currentPage, setCurrentPage)}
            </>
          ) : (
            <p className="text-center text-muted-foreground p-8">
              No resolved issues yet
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile fab button */}
      <div className="fixed right-4 bottom-4 sm:hidden">
        <Link to="/report">
          <Button size="lg" className="h-14 w-14 rounded-full">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default MyReports;
