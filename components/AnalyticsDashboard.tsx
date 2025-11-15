import React, { useState } from 'react';

interface AnalyticsDashboardProps {
  deckId: string;
  deckTitle: string;
}

interface ViewerData {
  id: string;
  name: string;
  email: string;
  viewedAt: string;
  duration: number;
  completionRate: number;
  device: 'desktop' | 'mobile' | 'tablet';
}

interface SlideEngagement {
  slideNumber: number;
  views: number;
  avgTimeSpent: number;
  engagement: number; // 0-100
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ deckId, deckTitle }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [roiInputs, setRoiInputs] = useState({
    avgDealSize: 50000,
    conversionRate: 15,
    timesSaved: 8,
    hourlyRate: 150
  });

  // Mock data - in production this would come from an API
  const metrics = {
    totalViews: 247,
    uniqueViewers: 189,
    avgDuration: 8.5,
    completionRate: 72,
    shares: 34,
    downloads: 56
  };

  const viewersData: ViewerData[] = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@techcorp.com', viewedAt: '2 hours ago', duration: 12.5, completionRate: 100, device: 'desktop' },
    { id: '2', name: 'Michael Chen', email: 'michael@innovate.io', viewedAt: '5 hours ago', duration: 8.2, completionRate: 68, device: 'mobile' },
    { id: '3', name: 'Emily Rodriguez', email: 'emily@venture.co', viewedAt: '1 day ago', duration: 15.3, completionRate: 100, device: 'desktop' },
    { id: '4', name: 'David Kim', email: 'david@growth.ai', viewedAt: '1 day ago', duration: 6.7, completionRate: 55, device: 'tablet' },
    { id: '5', name: 'Lisa Wang', email: 'lisa@datadrive.com', viewedAt: '2 days ago', duration: 10.1, completionRate: 85, device: 'desktop' }
  ];

  const slideEngagement: SlideEngagement[] = [
    { slideNumber: 1, views: 247, avgTimeSpent: 45, engagement: 95 },
    { slideNumber: 2, views: 234, avgTimeSpent: 32, engagement: 78 },
    { slideNumber: 3, views: 221, avgTimeSpent: 28, engagement: 72 },
    { slideNumber: 4, views: 198, avgTimeSpent: 35, engagement: 68 },
    { slideNumber: 5, views: 187, avgTimeSpent: 42, engagement: 81 },
    { slideNumber: 6, views: 178, avgTimeSpent: 38, engagement: 75 },
    { slideNumber: 7, views: 165, avgTimeSpent: 25, engagement: 62 },
    { slideNumber: 8, views: 156, avgTimeSpent: 30, engagement: 70 }
  ];

  const calculateROI = () => {
    const revenueImpact = (roiInputs.avgDealSize * roiInputs.conversionRate) / 100;
    const timeSavings = roiInputs.timesSaved * roiInputs.hourlyRate;
    const totalROI = revenueImpact + timeSavings;
    return {
      revenueImpact,
      timeSavings,
      totalROI,
      roiMultiple: totalROI / 35 // Assuming $35/mo Startup pricing
    };
  };

  const roi = calculateROI();

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
          </svg>
        );
      case 'mobile':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      case 'tablet':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v12h12V4H4z" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl gradient-text mb-2">Analytics Dashboard</h1>
            <p className="text-brand-text-secondary">{deckTitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border-2 border-brand-border/30 shadow-sm">
              {[
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
                { value: '90d', label: '90 Days' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    timeRange === range.value
                      ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-premium'
                      : 'text-brand-text-secondary hover:text-brand-primary-500'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <button className="btn btn-primary shadow-btn hover:shadow-btn-hover">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Total Views', value: metrics.totalViews, change: '+12%', icon: '👁️', color: 'from-blue-500 to-blue-600' },
            { label: 'Unique Viewers', value: metrics.uniqueViewers, change: '+8%', icon: '👥', color: 'from-purple-500 to-purple-600' },
            { label: 'Avg Duration', value: `${metrics.avgDuration}m`, change: '+5%', icon: '⏱️', color: 'from-green-500 to-green-600' },
            { label: 'Completion Rate', value: `${metrics.completionRate}%`, change: '+3%', icon: '✅', color: 'from-orange-500 to-orange-600' },
            { label: 'Shares', value: metrics.shares, change: '+15%', icon: '🔗', color: 'from-pink-500 to-pink-600' },
            { label: 'Downloads', value: metrics.downloads, change: '+10%', icon: '⬇️', color: 'from-cyan-500 to-cyan-600' }
          ].map((metric, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl bg-white border-2 border-brand-border/30 hover:border-brand-primary-300 hover:shadow-premium transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"></div>

              <div className="flex items-start justify-between mb-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} text-white text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {metric.icon}
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                  {metric.change}
                </span>
              </div>

              <div className="font-display font-bold text-3xl text-brand-text-primary mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-brand-text-tertiary font-medium">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        <div className="bg-white rounded-3xl shadow-card-lg border-2 border-brand-border/30 overflow-hidden">
          <div className="relative p-6 border-b border-brand-border/30 bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-600">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-white">ROI Calculator</h2>
                <p className="text-sm text-white/80">Calculate the value deckr.ai brings to your team</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-4">
                <h3 className="font-semibold text-brand-text-primary mb-4">Your Metrics</h3>

                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Average Deal Size ($)
                  </label>
                  <input
                    type="number"
                    value={roiInputs.avgDealSize}
                    onChange={(e) => setRoiInputs({ ...roiInputs, avgDealSize: Number(e.target.value) })}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Expected Conversion Rate (%)
                  </label>
                  <input
                    type="number"
                    value={roiInputs.conversionRate}
                    onChange={(e) => setRoiInputs({ ...roiInputs, conversionRate: Number(e.target.value) })}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Hours Saved Per Month
                  </label>
                  <input
                    type="number"
                    value={roiInputs.timesSaved}
                    onChange={(e) => setRoiInputs({ ...roiInputs, timesSaved: Number(e.target.value) })}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    value={roiInputs.hourlyRate}
                    onChange={(e) => setRoiInputs({ ...roiInputs, hourlyRate: Number(e.target.value) })}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <h3 className="font-semibold text-brand-text-primary mb-4">Projected Value</h3>

                <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                    Revenue Impact
                  </div>
                  <div className="font-display font-bold text-3xl text-green-600">
                    ${roi.revenueImpact.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1">per month</div>
                </div>

                <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                    Time Savings Value
                  </div>
                  <div className="font-display font-bold text-3xl text-blue-600">
                    ${roi.timeSavings.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">per month</div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 text-white shadow-premium">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-90">
                    Total Monthly Value
                  </div>
                  <div className="font-display font-bold text-4xl mb-2">
                    ${roi.totalROI.toLocaleString()}
                  </div>
                  <div className="text-sm opacity-90">
                    {roi.roiMultiple.toFixed(1)}x return on investment
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Engagement Heatmap */}
        <div className="bg-white rounded-3xl shadow-card-lg border-2 border-brand-border/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-brand-text-primary mb-1">Slide Engagement</h2>
              <p className="text-sm text-brand-text-tertiary">See which slides resonate most with your audience</p>
            </div>
          </div>

          <div className="space-y-3">
            {slideEngagement.map((slide) => (
              <div key={slide.slideNumber} className="group">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 text-brand-primary-600 font-bold text-sm">
                    {slide.slideNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-brand-text-primary">
                        Slide {slide.slideNumber}
                      </span>
                      <span className="text-xs text-brand-text-tertiary">
                        {slide.views} views • {slide.avgTimeSpent}s avg
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                          slide.engagement >= 80
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : slide.engagement >= 60
                            ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}
                        style={{ width: `${slide.engagement}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-16">
                    <span className={`text-sm font-bold ${
                      slide.engagement >= 80 ? 'text-green-600' : slide.engagement >= 60 ? 'text-brand-primary-600' : 'text-amber-600'
                    }`}>
                      {slide.engagement}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Viewers Table */}
        <div className="bg-white rounded-3xl shadow-card-lg border-2 border-brand-border/30 overflow-hidden">
          <div className="p-6 border-b border-brand-border/30">
            <h2 className="font-display font-bold text-xl text-brand-text-primary mb-1">Recent Viewers</h2>
            <p className="text-sm text-brand-text-tertiary">Track who's engaging with your deck</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-br from-gray-50 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-tertiary uppercase tracking-wider">Viewer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-tertiary uppercase tracking-wider">Viewed</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-tertiary uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-tertiary uppercase tracking-wider">Completion</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-tertiary uppercase tracking-wider">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20">
                {viewersData.map((viewer) => (
                  <tr key={viewer.id} className="hover:bg-gradient-to-r hover:from-brand-primary-50/50 hover:to-brand-accent-50/50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-sm text-brand-text-primary">{viewer.name}</div>
                        <div className="text-xs text-brand-text-tertiary">{viewer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-text-secondary">{viewer.viewedAt}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-brand-text-primary">{viewer.duration}m</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 rounded-full"
                            style={{ width: `${viewer.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-brand-text-primary">{viewer.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-brand-text-tertiary">
                        {getDeviceIcon(viewer.device)}
                        <span className="text-sm capitalize">{viewer.device}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
