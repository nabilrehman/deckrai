import React, { useState, useEffect } from 'react';
import { getAllUsers, getTotalUsageStats } from '../services/firestoreService';
import { UserProfile } from '../types';

interface AdminDashboardProps {
    onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState<{
        totalUsers: number;
        totalDecks: number;
        totalSlides: number;
        freeUsers: number;
        proUsers: number;
        enterpriseUsers: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [usersData, statsData] = await Promise.all([
                getAllUsers(100),
                getTotalUsageStats()
            ]);
            setUsers(usersData);
            setStats(statsData);
        } catch (err: any) {
            console.error('Error loading admin data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 max-w-7xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-brand-text-primary">
                            Admin Dashboard
                        </h2>
                        <p className="text-brand-text-secondary text-sm mt-1">
                            System overview and user management
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <svg className="animate-spin h-12 w-12 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-brand-text-secondary">Loading dashboard data...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-600 text-sm">{error}</p>
                        <button onClick={loadData} className="mt-2 text-sm text-red-700 underline">
                            Retry
                        </button>
                    </div>
                )}

                {/* Stats Overview */}
                {!loading && stats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                                <div className="text-2xl font-bold text-blue-700">{stats.totalUsers}</div>
                                <div className="text-sm text-blue-600">Total Users</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                                <div className="text-2xl font-bold text-green-700">{stats.totalDecks}</div>
                                <div className="text-sm text-green-600">Total Decks</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                                <div className="text-2xl font-bold text-purple-700">{stats.totalSlides}</div>
                                <div className="text-sm text-purple-600">Total Slides</div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                                <div className="text-2xl font-bold text-gray-700">{stats.freeUsers}</div>
                                <div className="text-sm text-gray-600">Free Users</div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                                <div className="text-2xl font-bold text-indigo-700">{stats.proUsers}</div>
                                <div className="text-sm text-indigo-600">Pro Users</div>
                            </div>
                            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
                                <div className="text-2xl font-bold text-pink-700">{stats.enterpriseUsers}</div>
                                <div className="text-sm text-pink-600">Enterprise Users</div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-semibold text-brand-text-primary">Recent Users</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Plan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Slides This Month
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Decks This Month
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Joined
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Login
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((user) => (
                                            <tr key={user.uid} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            {user.photoURL ? (
                                                                <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-brand-primary-100 flex items-center justify-center">
                                                                    <span className="text-brand-primary-700 font-semibold">
                                                                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        user.plan === 'free' ? 'bg-gray-100 text-gray-800' :
                                                        user.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {user.plan.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.usage.slidesThisMonth}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.usage.decksThisMonth}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.lastLoginAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {users.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No users found</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
