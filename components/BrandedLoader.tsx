import React from 'react';

interface BrandedLoaderProps {
  size?: number;
  text?: string;
  variant?: 'inline' | 'block';
}

const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  size = 20,
  text,
  variant = 'inline'
}) => {
  return (
    <div style={{
      display: variant === 'inline' ? 'inline-flex' : 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      {/* Sparkle + Arc Loader */}
      <div style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Rotating Arc */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          style={{
            position: 'absolute',
            animation: 'rotate-arc 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }}
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="url(#gradient-arc)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="40 60"
            opacity="0.8"
          />
          <defs>
            <linearGradient id="gradient-arc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Sparkle Icon - Professional 4-point star */}
        <svg
          width={size * 0.7}
          height={size * 0.7}
          viewBox="0 0 24 24"
          fill="none"
          style={{
            position: 'relative',
            animation: 'pulse-sparkle 1.2s ease-in-out infinite'
          }}
        >
          {/* Main sparkle - refined 4-point star */}
          <path
            d="M12 1L13.5 9L21.5 10.5L13.5 12L12 20L10.5 12L2.5 10.5L10.5 9L12 1Z"
            fill="url(#gradient-sparkle)"
            stroke="url(#gradient-sparkle-stroke)"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="gradient-sparkle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="gradient-sparkle-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7E22CE" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Optional Text */}
      {text && (
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#6B7280',
          letterSpacing: '-0.006em'
        }}>
          {text}
        </span>
      )}

      <style>{`
        @keyframes rotate-arc {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-sparkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};

export default BrandedLoader;
