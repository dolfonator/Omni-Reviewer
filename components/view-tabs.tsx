"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardedView } from "@/components/carded-view";
import { LockedInView } from "@/components/locked-in-view";
import { SummaryView } from "@/components/summary-view";
import { TestMeView } from "@/components/test-me-view";
import type { ViewsPayload } from "@/components/generate-button";

type ViewTabsProps = {
  views: ViewsPayload;
};

export function ViewTabs({ views }: ViewTabsProps) {
  return (
    <Tabs defaultValue="locked_in" className="w-full gap-4">
      <div className="overflow-x-auto">
        <TabsList
          variant="line"
          className="min-w-full sm:min-w-0"
          aria-label="Study views"
        >
          <TabsTrigger value="locked_in" className="min-w-[6.5rem]">
            Locked In
          </TabsTrigger>
          <TabsTrigger value="summary" className="min-w-[6.5rem]">
            Summary
          </TabsTrigger>
          <TabsTrigger value="test_me" className="min-w-[6.5rem]">
            Test Me
          </TabsTrigger>
          <TabsTrigger value="carded" className="min-w-[6.5rem]">
            Carded
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="locked_in" className="outline-none">
        <LockedInView content={views.locked_in?.content ?? null} />
      </TabsContent>
      <TabsContent value="summary" className="outline-none">
        <SummaryView content={views.summary?.content ?? null} />
      </TabsContent>
      <TabsContent value="test_me" className="outline-none">
        <TestMeView
          contentJson={views.test_me?.contentJson ?? null}
          content={views.test_me?.content ?? null}
        />
      </TabsContent>
      <TabsContent value="carded" className="outline-none">
        <CardedView
          contentJson={views.carded?.contentJson ?? null}
          content={views.carded?.content ?? null}
        />
      </TabsContent>
    </Tabs>
  );
}
