import React, { useState } from 'react';

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  persona: string;
  useCase: string;
  teamSize: string;
  goals: string[];
  companyName: string;
}

interface Persona {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
}

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    persona: '',
    useCase: '',
    teamSize: '',
    goals: [],
    companyName: ''
  });

  const totalSteps = 5;

  const personas: Persona[] = [
    {
      id: 'sales',
      title: 'Sales Professional',
      description: 'Close more deals with winning pitch decks',
      icon: '💼',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'marketing',
      title: 'Marketing Leader',
      description: 'Create compelling campaign presentations',
      icon: '📊',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'executive',
      title: 'Executive',
      description: 'Deliver impactful board presentations',
      icon: '👔',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'founder',
      title: 'Founder / CEO',
      description: 'Build investor-ready pitch decks',
      icon: '🚀',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      id: 'consultant',
      title: 'Consultant',
      description: 'Craft professional client deliverables',
      icon: '💡',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'other',
      title: 'Other',
      description: 'Use deckr.ai for various needs',
      icon: '✨',
      gradient: 'from-pink-500 to-pink-600'
    }
  ];

  const useCases: UseCase[] = [
    { id: 'sales', title: 'Sales Pitches', description: 'Win more deals', icon: '🎯' },
    { id: 'investor', title: 'Investor Decks', description: 'Raise capital', icon: '💰' },
    { id: 'marketing', title: 'Marketing Campaigns', description: 'Drive engagement', icon: '📈' },
    { id: 'training', title: 'Training Materials', description: 'Educate teams', icon: '🎓' },
    { id: 'reports', title: 'Executive Reports', description: 'Share insights', icon: '📋' },
    { id: 'proposals', title: 'Business Proposals', description: 'Secure partnerships', icon: '🤝' }
  ];

  const teamSizes = [
    { id: 'solo', label: 'Just Me', description: 'Individual contributor' },
    { id: 'small', label: '2-10 people', description: 'Small team' },
    { id: 'medium', label: '11-50 people', description: 'Growing company' },
    { id: 'large', label: '50+ people', description: 'Enterprise' }
  ];

  const goals = [
    { id: 'speed', label: 'Create decks faster', icon: '⚡' },
    { id: 'quality', label: 'Improve design quality', icon: '🎨' },
    { id: 'consistency', label: 'Brand consistency', icon: '🎯' },
    { id: 'collaboration', label: 'Team collaboration', icon: '👥' },
    { id: 'analytics', label: 'Track engagement', icon: '📊' },
    { id: 'automation', label: 'Automate creation', icon: '🤖' }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGoal = (goalId: string) => {
    setData({
      ...data,
      goals: data.goals.includes(goalId)
        ? data.goals.filter(g => g !== goalId)
        : [...data.goals, goalId]
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.companyName.trim().length > 0;
      case 2:
        return data.persona !== '';
      case 3:
        return data.useCase !== '';
      case 4:
        return data.teamSize !== '';
      case 5:
        return data.goals.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-primary-500/20 via-brand-accent-500/20 to-brand-primary-600/20 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-premium border-2 border-brand-border/30 w-full max-w-4xl overflow-hidden animate-scale-in">
        {/* Header with gradient accent */}
        <div className="relative p-8 pb-6 border-b border-brand-border/30 bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-600">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display font-bold text-3xl text-white mb-2">Welcome to deckr.ai</h1>
              <p className="text-white/90">Let's personalize your experience in just a few steps</p>
            </div>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-3xl">✨</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    index + 1 < currentStep
                      ? 'bg-white border-white text-brand-primary-600'
                      : index + 1 === currentStep
                      ? 'bg-white border-white text-brand-primary-600 scale-110 shadow-lg'
                      : 'bg-white/20 border-white/40 text-white/60'
                  }`}>
                    {index + 1 < currentStep ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    index + 1 === currentStep ? 'text-white' : 'text-white/60'
                  }`}>
                    Step {index + 1}
                  </span>
                </div>
                {index < totalSteps - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                    index + 1 < currentStep ? 'bg-white' : 'bg-white/30'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[400px]">
          {/* Step 1: Company Name */}
          {currentStep === 1 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl gradient-text mb-3">Let's start with your company</h2>
                <p className="text-brand-text-secondary">This helps us personalize your decks with your branding</p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-semibold text-brand-text-primary mb-3">
                  Company Name
                </label>
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  placeholder="Enter your company name"
                  className="input-premium w-full text-center text-xl"
                  autoFocus
                />
              </div>

              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-brand-border/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-brand-text-tertiary">Your data is private and secure</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Persona Selection */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl gradient-text mb-3">What best describes you?</h2>
                <p className="text-brand-text-secondary">We'll tailor your experience to your role</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => setData({ ...data, persona: persona.id })}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      data.persona === persona.id
                        ? 'border-brand-primary-500 bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 shadow-premium scale-105'
                        : 'border-brand-border/50 hover:border-brand-primary-300 bg-white hover:shadow-card'
                    }`}
                  >
                    {data.persona === persona.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${persona.gradient} text-white text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      {persona.icon}
                    </div>
                    <div className="font-bold text-brand-text-primary mb-2">{persona.title}</div>
                    <div className="text-xs text-brand-text-tertiary">{persona.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Use Case */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl gradient-text mb-3">What will you create with deckr.ai?</h2>
                <p className="text-brand-text-secondary">Choose your primary use case</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {useCases.map((useCase) => (
                  <button
                    key={useCase.id}
                    onClick={() => setData({ ...data, useCase: useCase.id })}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      data.useCase === useCase.id
                        ? 'border-brand-primary-500 bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 shadow-premium scale-105'
                        : 'border-brand-border/50 hover:border-brand-primary-300 bg-white hover:shadow-card'
                    }`}
                  >
                    {data.useCase === useCase.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{useCase.icon}</div>
                    <div className="font-bold text-brand-text-primary mb-1">{useCase.title}</div>
                    <div className="text-xs text-brand-text-tertiary">{useCase.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Team Size */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl gradient-text mb-3">How big is your team?</h2>
                <p className="text-brand-text-secondary">This helps us recommend the right plan</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-3">
                {teamSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setData({ ...data, teamSize: size.id })}
                    className={`group relative w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left flex items-center justify-between ${
                      data.teamSize === size.id
                        ? 'border-brand-primary-500 bg-gradient-to-r from-brand-primary-50 to-brand-accent-50 shadow-premium'
                        : 'border-brand-border/50 hover:border-brand-primary-300 bg-white hover:shadow-card'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-lg text-brand-text-primary mb-1">{size.label}</div>
                      <div className="text-sm text-brand-text-tertiary">{size.description}</div>
                    </div>

                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                      data.teamSize === size.id
                        ? 'bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 border-brand-primary-500'
                        : 'border-brand-border/50'
                    }`}>
                      {data.teamSize === size.id && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Goals */}
          {currentStep === 5 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl gradient-text mb-3">What are your goals?</h2>
                <p className="text-brand-text-secondary">Select all that apply (you can change these later)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      data.goals.includes(goal.id)
                        ? 'border-brand-primary-500 bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 shadow-premium'
                        : 'border-brand-border/50 hover:border-brand-primary-300 bg-white hover:shadow-card'
                    }`}
                  >
                    {data.goals.includes(goal.id) && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{goal.icon}</div>
                    <div className="font-bold text-brand-text-primary">{goal.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gradient-to-br from-gray-50 to-slate-50 border-t border-brand-border/30 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>

          <div className="text-sm text-brand-text-tertiary">
            Step {currentStep} of {totalSteps}
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn btn-primary shadow-btn hover:shadow-btn-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {currentStep === totalSteps ? 'Get Started' : 'Continue'}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
