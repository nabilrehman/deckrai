import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { getCreditHistory, getCreditStats } from '../services/creditService';
import { CreditTransaction } from '../types';

interface UsagePageProps {
  onBack?: () => void;
  onNavigateToPricing?: () => void;
}

const UsagePage: React.FC<UsagePageProps> = ({ onBack, onNavigateToPricing }) => {
  const { user } = useAuth();
  const { credits, creditBalance } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(false);

  // Calculate usage percentage (example: based on a monthly limit or lifetime usage)
  const currentPeriodUsage = creditBalance?.usedCreditsThisMonth || 0;
  const monthlyLimit = 100; // Example limit - adjust based on user's plan
  const usagePercentage = Math.min((currentPeriodUsage / monthlyLimit) * 100, 100);

  // Calculate time until reset (example: assumes monthly reset on 1st of month)
  const getTimeUntilReset = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diff = nextMonth.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `in ${days} day${days > 1 ? 's' : ''} ${hours} hr`;
    } else {
      return `in ${hours} hr ${minutes} min`;
    }
  };

  // Load transaction history and stats
  useEffect(() => {
    const loadUsageData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const [history, statistics] = await Promise.all([
          getCreditHistory(user.uid, 20),
          getCreditStats(user.uid)
        ]);

        setTransactions(history);
        setStats(statistics);
      } catch (error) {
        console.error('Failed to load usage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsageData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to view your usage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Usage</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Plan Usage Limits Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Plan usage limits</h2>

          {/* Current Session */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Current session</h3>
                <p className="text-xs text-gray-500">Resets {getTimeUntilReset()}</p>
              </div>
              <span className="text-sm font-medium text-gray-700">{usagePercentage.toFixed(0)}% used</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>

          {/* Weekly Limits */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Weekly limits</h3>
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700">
                Learn more about usage limits
              </a>
            </div>

            {/* All models */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">All models</h4>
                  <p className="text-xs text-gray-500">Resets {getTimeUntilReset()}</p>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {creditBalance?.usedCreditsThisMonth || 0} / {monthlyLimit} used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>

            {/* Opus only (example of different model limits) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900">Premium generations</h4>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm font-medium text-gray-700">2% used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: '2%' }}
                />
              </div>
            </div>

            {/* Last updated */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Last updated: just now</span>
            </div>
          </div>
        </div>

        {/* Extra Usage (Auto Top-up) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Extra usage</h2>
              <p className="text-sm text-gray-600">
                Use a wallet to pay for extra usage when you exceed your subscription limits
              </p>
            </div>
            <button
              onClick={() => setAutoTopUpEnabled(!autoTopUpEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoTopUpEnabled ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoTopUpEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {autoTopUpEnabled && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-sm text-indigo-900 mb-3">
                🎉 Auto top-up enabled! We'll automatically add credits when you run low.
              </p>
              <button
                onClick={onNavigateToPricing}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Configure auto top-up →
              </button>
            </div>
          )}
        </div>

        {/* Credit Balance Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Credit Balance</h2>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mb-6">
            <div className="text-5xl font-bold mb-2">{credits || 0}</div>
            <div className="text-indigo-100 text-sm">Available credits</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-2xl font-semibold">{creditBalance?.usedCreditsThisMonth || 0}</div>
              <div className="text-indigo-100 text-xs">Used this month</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{creditBalance?.usedCreditsLifetime || 0}</div>
              <div className="text-indigo-100 text-xs">Used lifetime</div>
            </div>
          </div>
          <button
            onClick={onNavigateToPricing}
            className="w-full bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Get More Credits
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500 mt-4">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No transactions yet</p>
              <button
                onClick={onNavigateToPricing}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Purchase your first credits →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'purchase' || transaction.type === 'bonus'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}>
                      {transaction.type === 'purchase' || transaction.type === 'bonus' ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </div>
                    <div className="text-sm text-gray-500">
                      Balance: {transaction.balanceAfter}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Stats (if available) */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total Slides Created</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCreditsLifetime}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total Purchases</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Avg. Cost/Slide</div>
              <div className="text-2xl font-bold text-gray-900">
                ${stats.averageCostPerSlide.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsagePage;
