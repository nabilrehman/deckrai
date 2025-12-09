/**
 * MAPWidget - Mutual Action Plan Widget
 *
 * A collaborative checklist for tracking deal milestones between
 * buyer and seller. Key feature of Digital Sales Rooms.
 *
 * Features:
 * - Task creation with assignment (buyer/seller)
 * - Due date support with relative dates (T+3 days)
 * - Status tracking (pending, in_progress, completed)
 * - External user assignment via email
 */

import React, { useState } from 'react';
import { MAPBlock, MAPTask } from '../../types';

interface MAPWidgetProps {
    block: MAPBlock;
    isEditing: boolean;
    updateBlock: (updates: Partial<MAPBlock>) => void;
    currentUserRole?: 'buyer' | 'seller';
    currentUserEmail?: string;
}

const MAPWidget: React.FC<MAPWidgetProps> = ({
    block,
    isEditing,
    updateBlock,
    currentUserRole = 'seller',
    currentUserEmail
}) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState<'buyer' | 'seller'>('seller');
    const [showAddTask, setShowAddTask] = useState(false);

    const tasks = block.tasks || [];

    // Add new task
    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;

        const newTask: MAPTask = {
            id: `task_${Date.now()}`,
            title: newTaskTitle.trim(),
            assignedTo: newTaskAssignee,
            status: 'pending'
        };

        updateBlock({ tasks: [...tasks, newTask] });
        setNewTaskTitle('');
        setShowAddTask(false);
    };

    // Update task status
    const handleToggleTask = (taskId: string) => {
        const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
                const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                return {
                    ...task,
                    status: newStatus,
                    completedAt: newStatus === 'completed' ? Date.now() : undefined,
                    completedBy: newStatus === 'completed' ? currentUserEmail : undefined
                };
            }
            return task;
        });
        updateBlock({ tasks: updatedTasks });
    };

    // Delete task
    const handleDeleteTask = (taskId: string) => {
        updateBlock({ tasks: tasks.filter(t => t.id !== taskId) });
    };

    // Update task
    const handleUpdateTask = (taskId: string, updates: Partial<MAPTask>) => {
        const updatedTasks = tasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
        );
        updateBlock({ tasks: updatedTasks });
    };

    // Calculate progress
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    // Group tasks by assignee
    const buyerTasks = tasks.filter(t => t.assignedTo === 'buyer');
    const sellerTasks = tasks.filter(t => t.assignedTo === 'seller');

    const TaskItem: React.FC<{ task: MAPTask }> = ({ task }) => {
        const isCompleted = task.status === 'completed';
        const isOverdue = task.dueDate && task.dueDate < Date.now() && !isCompleted;

        return (
            <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                isCompleted ? 'bg-green-50' : isOverdue ? 'bg-red-50' : 'bg-white hover:bg-gray-50'
            }`}>
                {/* Checkbox */}
                <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                    }`}
                >
                    {isCompleted && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                            className={`w-full bg-transparent border-0 p-0 focus:ring-0 text-sm ${
                                isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}
                        />
                    ) : (
                        <span className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                        </span>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-1">
                        {task.assigneeEmail && (
                            <span className="text-xs text-gray-500">{task.assigneeEmail}</span>
                        )}
                        {task.dueDate && (
                            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        )}
                        {task.completedAt && (
                            <span className="text-xs text-green-600">
                                Completed {new Date(task.completedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Due date picker (edit mode) */}
                {isEditing && (
                    <input
                        type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleUpdateTask(task.id, {
                            dueDate: e.target.value ? new Date(e.target.value).getTime() : undefined
                        })}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                    />
                )}

                {/* Delete button (edit mode) */}
                {isEditing && (
                    <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="p-6">
            {/* Header with Progress */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Mutual Action Plan</h3>
                    <p className="text-sm text-gray-500">
                        {completedCount} of {tasks.length} tasks completed
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="text-sm font-bold text-green-600">{progressPercent}%</span>
                </div>
            </div>

            {/* Two-column layout for buyer/seller tasks */}
            <div className="grid grid-cols-2 gap-6">
                {/* Seller Tasks */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-sm font-semibold text-gray-700">Your Team</span>
                        <span className="text-xs text-gray-400 ml-auto">{sellerTasks.length} tasks</span>
                    </div>
                    <div className="space-y-2">
                        {sellerTasks.map(task => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                        {sellerTasks.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">No tasks assigned</p>
                        )}
                    </div>
                </div>

                {/* Buyer Tasks */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-sm font-semibold text-gray-700">Client Team</span>
                        <span className="text-xs text-gray-400 ml-auto">{buyerTasks.length} tasks</span>
                    </div>
                    <div className="space-y-2">
                        {buyerTasks.map(task => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                        {buyerTasks.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">No tasks assigned</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Task Form (Edit Mode) */}
            {isEditing && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    {showAddTask ? (
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Enter task title..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            />
                            <select
                                value={newTaskAssignee}
                                onChange={(e) => setNewTaskAssignee(e.target.value as 'buyer' | 'seller')}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            >
                                <option value="seller">Your Team</option>
                                <option value="buyer">Client Team</option>
                            </select>
                            <button
                                onClick={handleAddTask}
                                className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setShowAddTask(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddTask(true)}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Task
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MAPWidget;
