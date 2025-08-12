
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, Calendar, BarChart3, DollarSign, Activity } from 'lucide-react';
import { useLeadsData } from '@/hooks/useLeadsData';
import { LeadsFilterOptions, LeadsData, LeadsMetricType } from '@/types/leads';
import { ImprovedLeadMetricCards } from './ImprovedLeadMetricCards';
import { ImprovedLeadTopLists } from './ImprovedLeadTopLists';
import { ImprovedLeadSourcePerformanceTable } from './ImprovedLeadSourcePerformanceTable';
import { ImprovedLeadMonthOnMonthTable } from './ImprovedLeadMonthOnMonthTable';
import { LeadYearOnYearSourceTable } from './LeadYearOnYearSourceTable';
import { LeadConversionAnalyticsTable } from './LeadConversionAnalyticsTable';
import { LeadDetailedFilterSection } from './LeadDetailedFilterSection';
import { formatNumber, formatCurrency } from '@/utils/formatters';

export const ImprovedLeadsSection = () => {
  const { data: leadsData, loading, error } = useLeadsData();
  const [activeMetric, setActiveMetric] = useState<LeadsMetricType>('totalLeads');
  const [filters, setFilters] = useState<LeadsFilterOptions>({
    dateRange: { start: '', end: '' },
    location: [],
    source: [],
    stage: [],
    status: [],
    associate: [],
    channel: [],
    trialStatus: [],
    conversionStatus: [],
    retentionStatus: [],
    minLTV: undefined,
    maxLTV: undefined
  });

  // Extract unique values for filters
  const uniqueValues = useMemo(() => {
    if (!leadsData) return {
      sources: [],
      associates: [],
      centers: [],
      stages: [],
      statuses: []
    };

    return {
      sources: [...new Set(leadsData.map(item => item.source).filter(Boolean))],
      associates: [...new Set(leadsData.map(item => item.associate).filter(Boolean))],
      centers: [...new Set(leadsData.map(item => item.center).filter(Boolean))],
      stages: [...new Set(leadsData.map(item => item.stage).filter(Boolean))],
      statuses: [...new Set(leadsData.map(item => item.status).filter(Boolean))]
    };
  }, [leadsData]);

  // Convert LeadsFilterOptions to the format expected by LeadDetailedFilterSection
  const detailedFilters = useMemo(() => ({
    source: filters.source,
    associate: filters.associate,
    center: filters.location, // Map location to center
    stage: filters.stage,
    status: filters.status,
    dateRange: {
      start: filters.dateRange.start ? new Date(filters.dateRange.start) : null,
      end: filters.dateRange.end ? new Date(filters.dateRange.end) : null
    }
  }), [filters]);

  const handleDetailedFiltersChange = (newFilters: any) => {
    setFilters({
      ...filters,
      source: newFilters.source,
      associate: newFilters.associate,
      location: newFilters.center, // Map center back to location
      stage: newFilters.stage,
      status: newFilters.status,
      dateRange: {
        start: newFilters.dateRange.start ? newFilters.dateRange.start.toISOString() : '',
        end: newFilters.dateRange.end ? newFilters.dateRange.end.toISOString() : ''
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      location: [],
      source: [],
      stage: [],
      status: [],
      associate: [],
      channel: [],
      trialStatus: [],
      conversionStatus: [],
      retentionStatus: [],
      minLTV: undefined,
      maxLTV: undefined
    });
  };

  // Filter leads data based on current filters
  const filteredLeadsData = useMemo(() => {
    if (!leadsData) return [];

    return leadsData.filter(lead => {
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const leadDate = new Date(lead.createdAt);
        if (filters.dateRange.start && leadDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && leadDate > new Date(filters.dateRange.end)) return false;
      }

      // Array filters
      if (filters.location.length > 0 && !filters.location.includes(lead.center)) return false;
      if (filters.source.length > 0 && !filters.source.includes(lead.source)) return false;
      if (filters.stage.length > 0 && !filters.stage.includes(lead.stage)) return false;
      if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false;
      if (filters.associate.length > 0 && !filters.associate.includes(lead.associate)) return false;
      if (filters.channel.length > 0 && !filters.channel.includes(lead.channel)) return false;
      if (filters.trialStatus.length > 0 && !filters.trialStatus.includes(lead.trialStatus)) return false;
      if (filters.conversionStatus.length > 0 && !filters.conversionStatus.includes(lead.conversionStatus)) return false;
      if (filters.retentionStatus.length > 0 && !filters.retentionStatus.includes(lead.retentionStatus)) return false;

      // LTV range filter
      if (filters.minLTV !== undefined && lead.ltv < filters.minLTV) return false;
      if (filters.maxLTV !== undefined && lead.ltv > filters.maxLTV) return false;

      return true;
    });
  }, [leadsData, filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading lead analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-medium">Error loading lead data</div>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Filter Section */}
        <LeadDetailedFilterSection
          filters={detailedFilters}
          onFiltersChange={handleDetailedFiltersChange}
          onClearFilters={clearFilters}
          uniqueValues={uniqueValues}
        />

        {/* Key Metrics */}
        <ImprovedLeadMetricCards data={filteredLeadsData} />

        {/* Main Analytics Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Lead Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="source-performance" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100">
                <TabsTrigger value="source-performance" className="gap-2">
                  <Target className="w-4 h-4" />
                  Source Performance
                </TabsTrigger>
                <TabsTrigger value="conversion-analytics" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Conversion Analytics
                </TabsTrigger>
                <TabsTrigger value="month-comparison" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Month Comparison
                </TabsTrigger>
                <TabsTrigger value="year-comparison" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Year Comparison
                </TabsTrigger>
              </TabsList>

              <TabsContent value="source-performance" className="mt-6">
                <ImprovedLeadSourcePerformanceTable data={filteredLeadsData} />
              </TabsContent>

              <TabsContent value="conversion-analytics" className="mt-6">
                <LeadConversionAnalyticsTable data={filteredLeadsData} />
              </TabsContent>

              <TabsContent value="month-comparison" className="mt-6">
                <ImprovedLeadMonthOnMonthTable data={filteredLeadsData} />
              </TabsContent>

              <TabsContent value="year-comparison" className="mt-6">
                <LeadYearOnYearSourceTable
                  allData={leadsData || []}
                  activeMetric={activeMetric}
                  onMetricChange={setActiveMetric}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <ImprovedLeadTopLists data={filteredLeadsData} />
      </div>
    </div>
  );
};
