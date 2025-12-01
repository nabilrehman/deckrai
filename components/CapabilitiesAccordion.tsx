import React, { useState } from 'react';
import { STARTER_PROMPTS, STARTER_PROMPTS_EXTENDED, StarterPrompt } from '../constants';

interface CapabilitiesAccordionProps {
  onPromptClick: (prompt: string) => void;
}

interface OutputCapability {
  category: string;
  icon: string;
  types: {
    name: string;
    description: string;
    example: string;
  }[];
}

const CAPABILITIES: OutputCapability[] = [
  {
    category: 'Presentations',
    icon: '📊',
    types: [
      {
        name: 'Sales Deck',
        description: '5-15 slides for pitches and reviews',
        example: '"Create a 10-slide sales deck for Q1 product launch"'
      },
      {
        name: 'Training Deck',
        description: 'Educational presentations',
        example: '"Training deck for onboarding new sales reps"'
      }
    ]
  },
  {
    category: 'One-Pagers',
    icon: '📄',
    types: [
      {
        name: 'Visual Slide',
        description: 'Single impactful slide (16:9)',
        example: '"One-pager summarizing our value proposition"'
      },
      {
        name: 'Poster',
        description: 'Large format print (11:17)',
        example: '"Poster for trade show booth"'
      },
      {
        name: 'Infographic',
        description: 'Vertical visual storytelling (9:16)',
        example: '"Infographic showing our 2024 achievements"'
      }
    ]
  },
  {
    category: 'Social Media',
    icon: '📱',
    types: [
      {
        name: 'LinkedIn Carousel',
        description: '4-6 slides optimized for LinkedIn (4:5)',
        example: '"LinkedIn carousel: 5 tips for remote work"'
      }
    ]
  },
  {
    category: 'Documents',
    icon: '📑',
    types: [
      {
        name: 'Case Study',
        description: 'Customer success stories',
        example: '"Case study from our Fortune 500 win"'
      },
      {
        name: 'Sales Brochure',
        description: 'Multi-page PDF for product catalog',
        example: '"Product brochure for trade show"'
      },
      {
        name: 'Follow-up Document',
        description: 'Post-meeting summaries and proposals',
        example: '"Follow-up memo after Nike discovery call"'
      }
    ]
  },
  {
    category: 'Edit & Refine',
    icon: '✏️',
    types: [
      {
        name: 'Customize Deck',
        description: 'Adapt existing deck for specific customer',
        example: '"Customize our master deck for Nike meeting"'
      },
      {
        name: 'Update Slides',
        description: 'Refresh content for new audience',
        example: '"Update deck for healthcare industry"'
      }
    ]
  }
];

/**
 * CapabilitiesAccordion Component
 *
 * Expandable "See all output types" section using progressive disclosure.
 * Part of Phase 1 UX enhancement for multi-output content creation.
 */
const CapabilitiesAccordion: React.FC<CapabilitiesAccordionProps> = ({
  onPromptClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      marginBottom: '24px'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'transparent',
          border: '1.5px solid #E0E0E0',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#616161',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          width: '100%',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#FAFAFA';
          e.currentTarget.style.borderColor = '#BDBDBD';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = '#E0E0E0';
        }}
      >
        <span style={{
          transition: 'transform 0.2s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block'
        }}>
          ▼
        </span>
        <span>{isExpanded ? 'Hide all output types' : 'See all output types'}</span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          marginTop: '16px',
          padding: '20px',
          background: '#FAFAFA',
          border: '1px solid #E0E0E0',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {CAPABILITIES.map((capability, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Category Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #E0E0E0'
              }}>
                <span style={{ fontSize: '20px' }}>{capability.icon}</span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#424242',
                  letterSpacing: '-0.01em'
                }}>
                  {capability.category}
                </span>
              </div>

              {/* Types Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px'
              }}>
                {capability.types.map((type, typeIdx) => (
                  <div
                    key={typeIdx}
                    style={{
                      padding: '12px',
                      background: 'white',
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    {/* Type Name */}
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#424242'
                    }}>
                      {type.name}
                    </div>

                    {/* Description */}
                    <div style={{
                      fontSize: '13px',
                      color: '#757575',
                      lineHeight: '1.4'
                    }}>
                      {type.description}
                    </div>

                    {/* Example (clickable) */}
                    <button
                      onClick={() => {
                        // Extract example text without quotes
                        const cleanExample = type.example.replace(/^"|"$/g, '');
                        onPromptClick(cleanExample);
                      }}
                      style={{
                        marginTop: '4px',
                        padding: '6px 10px',
                        background: 'transparent',
                        border: '1px solid #E0E0E0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#8B5CF6',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                        fontStyle: 'italic'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F5F3FF';
                        e.currentTarget.style.borderColor = '#8B5CF6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#E0E0E0';
                      }}
                    >
                      {type.example}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Help Text */}
          <div style={{
            padding: '12px',
            background: 'white',
            border: '1px solid #DDD6FE',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#616161',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: '#8B5CF6' }}>💡 Tip:</strong> Just describe what you need in natural language.
            Our AI will automatically detect the right format and create it for you.
          </div>
        </div>
      )}
    </div>
  );
};

export default CapabilitiesAccordion;
