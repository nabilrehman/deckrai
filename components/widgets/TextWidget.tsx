/**
 * TextWidget - Rich Text Block for Workspace Editor
 *
 * Features:
 * - WYSIWYG editing with formatting toolbar
 * - Variable injection support ({{client_name}}, {{rep_name}}, etc.)
 * - Clean HTML output
 */

import React, { useRef, useState, useEffect } from 'react';
import { TextBlock } from '../../types';

interface TextWidgetProps {
    block: TextBlock;
    isEditing: boolean;
    updateBlock: (updates: Partial<TextBlock>) => void;
    variables?: Record<string, string>; // For variable injection
}

const TextWidget: React.FC<TextWidgetProps> = ({ block, isEditing, updateBlock, variables = {} }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showToolbar, setShowToolbar] = useState(false);

    // Initialize content
    useEffect(() => {
        if (editorRef.current && block.content) {
            editorRef.current.innerHTML = processVariables(block.content, variables);
        }
    }, [block.content, variables]);

    // Process {{variable}} syntax
    const processVariables = (content: string, vars: Record<string, string>): string => {
        return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            return vars[varName] || `<span class="bg-yellow-100 px-1 rounded text-yellow-700">${match}</span>`;
        });
    };

    // Format commands
    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleContentChange = () => {
        if (editorRef.current) {
            updateBlock({ content: editorRef.current.innerHTML });
        }
    };

    const FormatButton: React.FC<{
        command: string;
        icon: React.ReactNode;
        title: string;
        value?: string;
    }> = ({ command, icon, title, value }) => (
        <button
            type="button"
            onClick={() => execCommand(command, value)}
            className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title={title}
        >
            {icon}
        </button>
    );

    // View mode (public viewer)
    if (!isEditing) {
        return (
            <div className="p-6">
                <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: processVariables(block.content || '', variables) }}
                />
            </div>
        );
    }

    // Edit mode
    return (
        <div className="border-0">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50">
                {/* Text Style */}
                <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
                    <select
                        onChange={(e) => execCommand('formatBlock', e.target.value)}
                        className="text-sm border-0 bg-transparent focus:ring-0 text-gray-600 cursor-pointer"
                        defaultValue=""
                    >
                        <option value="" disabled>Style</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                        <option value="h3">Heading 3</option>
                        <option value="p">Paragraph</option>
                    </select>
                </div>

                {/* Basic Formatting */}
                <div className="flex items-center gap-1 px-3 border-r border-gray-200">
                    <FormatButton
                        command="bold"
                        title="Bold (Ctrl+B)"
                        icon={<span className="font-bold text-sm">B</span>}
                    />
                    <FormatButton
                        command="italic"
                        title="Italic (Ctrl+I)"
                        icon={<span className="italic text-sm">I</span>}
                    />
                    <FormatButton
                        command="underline"
                        title="Underline (Ctrl+U)"
                        icon={<span className="underline text-sm">U</span>}
                    />
                    <FormatButton
                        command="strikeThrough"
                        title="Strikethrough"
                        icon={<span className="line-through text-sm">S</span>}
                    />
                </div>

                {/* Lists */}
                <div className="flex items-center gap-1 px-3 border-r border-gray-200">
                    <FormatButton
                        command="insertUnorderedList"
                        title="Bullet List"
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        }
                    />
                    <FormatButton
                        command="insertOrderedList"
                        title="Numbered List"
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                        }
                    />
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 px-3 border-r border-gray-200">
                    <FormatButton
                        command="justifyLeft"
                        title="Align Left"
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                            </svg>
                        }
                    />
                    <FormatButton
                        command="justifyCenter"
                        title="Align Center"
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
                            </svg>
                        }
                    />
                    <FormatButton
                        command="justifyRight"
                        title="Align Right"
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
                            </svg>
                        }
                    />
                </div>

                {/* Insert Variable */}
                <div className="flex items-center gap-1 px-3">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                execCommand('insertText', `{{${e.target.value}}}`);
                                e.target.value = '';
                            }
                        }}
                        className="text-sm border-0 bg-transparent focus:ring-0 text-indigo-600 cursor-pointer"
                        defaultValue=""
                    >
                        <option value="" disabled>+ Variable</option>
                        <option value="client_name">Client Name</option>
                        <option value="client_company">Client Company</option>
                        <option value="rep_name">Rep Name</option>
                        <option value="rep_email">Rep Email</option>
                        <option value="deal_value">Deal Value</option>
                        <option value="close_date">Close Date</option>
                    </select>
                </div>
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleContentChange}
                onBlur={handleContentChange}
                className="min-h-[200px] p-6 focus:outline-none prose prose-slate max-w-none"
                style={{ minHeight: '200px' }}
                placeholder="Start typing..."
                suppressContentEditableWarning
            />

            {/* Variable hint */}
            <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 text-xs text-indigo-600">
                <span className="font-medium">Tip:</span> Use {"{{variable_name}}"} syntax for dynamic content that auto-fills from CRM data.
            </div>
        </div>
    );
};

export default TextWidget;
