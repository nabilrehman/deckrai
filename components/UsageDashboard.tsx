import React from 'react';
import { useUserUsage } from '../hooks/useUserUsage';
import { PLAN_LIMITS } from '../types';

interface UsageDashboardProps {
    compact?: boolean;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({ compact = false }) => {
    const { userProfile, usage, loading } = useUserUsage();

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
        );
    }

    if (!userProfile || !usage) {
        return null;
    }

    const limits = PLAN_LIMITS[userProfile.plan];
    const slidePercentage = (usage.slidesThisMonth / limits.slidesPerMonth) * 100;
    const deckPercentage = (usage.decksThisMonth / limits.decksPerMonth) * 100;

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-yellow-500';
        return 'bg-brand-primary-500';
    };

    if (compact) {
        return (
            <div className="flex flex-col gap-2">
                <div>
                    <div className="flex justify-between text-xs text-brand-text-secondary mb-1">
                        <span className="font-medium">Slides this month</span>
                        <span className="font-semibold">{usage.slidesThisMonth} / {limits.slidesPerMonth}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(slidePercentage)}`}
                            style={{ width: `${Math.min(slidePercentage, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-brand-border p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-brand-text-primary">Your Usage</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userProfile.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                    userProfile.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                }`}>
                    {userProfile.plan.toUpperCase()}
                </span>
            </div>

            {/* Slides Usage */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-brand-text-secondary mb-2">
                    <span className="font-medium">Slides Generated</span>
                    <span className="font-semibold text-brand-text-primary">
                        {usage.slidesThisMonth} / {limits.slidesPerMonth}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(slidePercentage)}`}
                        style={{ width: `${Math.min(slidePercentage, 100)}%` }}
                    ></div>
                </div>
                {slidePercentage >= 90 && (
                    <p className="text-xs text-red-600 mt-1">You're running low on slides!</p>
                )}
            </div>

            {/* Decks Usage */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-brand-text-secondary mb-2">
                    <span className="font-medium">Decks Created</span>
                    <span className="font-semibold text-brand-text-primary">
                        {usage.decksThisMonth} / {limits.decksPerMonth}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(deckPercentage)}`}
                        style={{ width: `${Math.min(deckPercentage, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Upgrade prompt for free users */}
            {userProfile.plan === 'free' && slidePercentage >= 70 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-brand-primary-50 to-brand-accent-50 rounded-lg border border-brand-primary-200">
                    <p className="text-sm text-brand-text-primary font-medium mb-2">
                        Need more slides?
                    </p>
                    <button className="btn btn-primary text-sm py-2 w-full">
                        Upgrade to Pro →
                    </button>
                </div>
            )}

            {/* Reset date */}
            <p className="text-xs text-brand-text-tertiary mt-3 text-center">
                Resets on {new Date(new Date(usage.monthStart).setMonth(new Date(usage.monthStart).getMonth() + 1, 1)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
        </div>
    );
};

export default UsageDashboard;
