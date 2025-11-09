import React from 'react';
import { DeckAiExecutionPlan, DeckAiTask } from '../types';

interface DeckAiPlanModalProps {
    plan: DeckAiExecutionPlan;
    onConfirm: () => void;
    onCancel: () => void;
}

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);


const DeckAiPlanModal: React.FC<DeckAiPlanModalProps> = ({ plan, onConfirm, onCancel }) => {
    
    const renderTask = (task: DeckAiTask) => {
        if (task.type === 'EDIT_SLIDE') {
            return (
                 <li key={task.slideId} className="bg-brand-background p-4 rounded-lg border border-brand-border">
                    <p className="font-semibold text-brand-text-primary mb-1 flex items-center gap-2">
                        <span className="text-lg" role="img" aria-label="edit icon">✏️</span>
                        <span>Edit Slide: <span className="font-bold">{task.slideName}</span></span>
                    </p>
                    <p className="text-sm text-brand-text-secondary pl-7">
                        {task.detailed_prompt}
                    </p>
                </li>
            );
        }
        if (task.type === 'ADD_SLIDE') {
            return (
                 <li key={task.newSlideName} className="bg-brand-background p-4 rounded-lg border border-brand-border">
                    <p className="font-semibold text-brand-text-primary mb-1 flex items-center gap-2">
                        <span className="text-lg" role="img" aria-label="add icon">✨</span>
                        <span>Add New Slide: <span className="font-bold">{task.newSlideName}</span></span>
                    </p>
                    <p className="text-sm text-brand-text-secondary pl-7">
                        {task.detailed_prompt}
                    </p>
                </li>
            );
        }
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-brand-surface rounded-2xl shadow-2xl w-full max-w-2xl border border-brand-border flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-brand-border">
                    <h2 className="text-2xl font-bold text-brand-text-primary">AI Execution Plan</h2>
                    <p className="text-brand-text-secondary mt-1">Review the changes the AI is proposing for your deck.</p>
                </div>
                
                <div className="p-6 flex-grow overflow-y-auto bg-brand-background/50">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-2">AI's Thought Process</h3>
                            <p className="text-brand-text-secondary bg-brand-surface p-3 rounded-md border border-brand-border text-sm">{plan.thought_process}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-3">Planned Tasks ({(plan.tasks || []).length})</h3>
                            <ul className="space-y-3">
                                {plan.tasks?.map(renderTask)}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-brand-border bg-brand-surface flex justify-end items-center gap-4">
                    <button
                        onClick={onCancel}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn btn-success text-base px-6 py-3"
                    >
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Confirm & Execute Plan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeckAiPlanModal;