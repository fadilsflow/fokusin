"use client";

import { useState } from "react";
import { BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

type UserStats = {
  id: string;
  username: string;
  avatarUrl: string | null;
  totalFocusTime: number;
  streak: number;
};

type ActivitySummary = {
  hoursSpent: number;
  daysAccessed: number;
  currentStreak: number;
  lastActive: Date;
  username: string;
  avatarUrl: string | null;
};

// API fetching functions
const fetchSummary = async (): Promise<ActivitySummary> => {
  const res = await fetch("/api/stats?type=summary", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
};

const fetchRankings = async (): Promise<UserStats[]> => {
  const res = await fetch("/api/stats?type=rankings", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch rankings");
  return res.json();
};

const StatsSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-4 mb-6">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2 p-4 rounded-lg bg-background/5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
      <div className="space-y-2 p-4 rounded-lg bg-background/5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
      <div className="space-y-2 p-4 rounded-lg bg-background/5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
    </div>
  </div>
);

const RankingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 rounded-lg bg-background/5"
      >
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
);

export function StatsDialog() {
  const [open, setOpen] = useState(false);

  // Use React Query for data fetching with caching
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["stats", "summary"],
    queryFn: fetchSummary,
    enabled: open, // Only fetch when dialog is open
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2,
  });

  const { data: rankings, isLoading: rankingsLoading } = useQuery({
    queryKey: ["stats", "rankings"],
    queryFn: fetchRankings,
    enabled: open, // Only fetch when dialog is open
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2,
  });

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <BarChart className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-4">
            Statistics
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Activity Summary</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 mt-4">
            {summaryLoading ? (
              <StatsSkeleton />
            ) : summary ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={summary.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {summary.username?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{summary.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last active{" "}
                      {formatDistanceToNow(new Date(summary.lastActive), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-lg bg-background/5">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Hours Focused
                    </h4>
                    <p className="text-2xl font-bold">
                      {Math.floor(summary.hoursSpent)}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-background/5">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Days Accessed
                    </h4>
                    <p className="text-2xl font-bold">{summary.daysAccessed}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-background/5">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Current Streak
                    </h4>
                    <p className="text-2xl font-bold">
                      {summary.currentStreak} days
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No stats available
              </div>
            )}
          </TabsContent>

          <TabsContent value="rankings" className="mt-4">
            {rankingsLoading ? (
              <RankingSkeleton />
            ) : rankings?.length ? (
              <div className="space-y-4">
                {rankings.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-background/5"
                  >
                    <div className="flex-shrink-0 w-8 text-center font-bold">
                      #{index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {user.username?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(user.totalFocusTime)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.streak} day streak
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No rankings available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
