import React from 'react';

interface SlideGenerationLoaderProps {
  size?: number;
  text?: string;
  currentSlide?: number;
  totalSlides?: number;
}

const SlideGenerationLoader: React.FC<SlideGenerationLoaderProps> = ({
  size = 24,
  text,
  currentSlide,
  totalSlides
}) => {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      {/* Animated Slide Stack */}
      <div style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Slide 1 (Background) - Fading in */}
        <div
          style={{
            position: 'absolute',
            width: `${size * 0.75}px`,
            height: `${size * 0.65}px`,
            borderRadius: '2px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1.5px solid rgba(99, 102, 241, 0.3)',
            transform: 'translate(-4px, -2px) rotate(-3deg)',
            animation: 'fade-slide-1 1.5s ease-in-out infinite'
          }}
        />

        {/* Slide 2 (Middle) - Sliding up */}
        <div
          style={{
            position: 'absolute',
            width: `${size * 0.75}px`,
            height: `${size * 0.65}px`,
            borderRadius: '2px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
            border: '1.5px solid rgba(99, 102, 241, 0.5)',
            transform: 'translate(-2px, 0px) rotate(-1.5deg)',
            animation: 'fade-slide-2 1.5s ease-in-out infinite'
          }}
        />

        {/* Slide 3 (Front) - Appearing */}
        <div
          style={{
            position: 'absolute',
            width: `${size * 0.75}px`,
            height: `${size * 0.65}px`,
            borderRadius: '2px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            border: '1.5px solid #4F46E5',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            animation: 'fade-slide-3 1.5s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Mini content lines inside slide */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5px',
            opacity: 0.6
          }}>
            <div style={{
              width: `${size * 0.4}px`,
              height: '1.5px',
              background: 'white',
              borderRadius: '1px'
            }} />
            <div style={{
              width: `${size * 0.3}px`,
              height: '1.5px',
              background: 'white',
              borderRadius: '1px'
            }} />
          </div>
        </div>

        {/* Sparkle effect */}
        <svg
          width={size * 0.4}
          height={size * 0.4}
          viewBox="0 0 24 24"
          fill="none"
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            animation: 'sparkle-twinkle 1.5s ease-in-out infinite'
          }}
        >
          <path
            d="M12 2L13.09 8.26L18 10L13.09 11.74L12 18L10.91 11.74L6 10L10.91 8.26L12 2Z"
            fill="url(#gradient-sparkle-gen)"
          />
          <defs>
            <linearGradient id="gradient-sparkle-gen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      {(text || (currentSlide && totalSlides)) && (
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#6B7280',
          letterSpacing: '-0.006em'
        }}>
          {text || `Creating slide ${currentSlide}/${totalSlides}...`}
        </span>
      )}

      <style>{`
        @keyframes fade-slide-1 {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-4px, -2px) rotate(-3deg) scale(0.95);
          }
          33% {
            opacity: 0.6;
            transform: translate(-4px, -2px) rotate(-3deg) scale(1);
          }
          66% {
            opacity: 0.3;
            transform: translate(-4px, -2px) rotate(-3deg) scale(0.95);
          }
        }

        @keyframes fade-slide-2 {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-2px, 0px) rotate(-1.5deg) scale(0.97);
          }
          33% {
            opacity: 0.7;
            transform: translate(-2px, -1px) rotate(-1.5deg) scale(1);
          }
          66% {
            opacity: 0.5;
            transform: translate(-2px, 0px) rotate(-1.5deg) scale(0.97);
          }
        }

        @keyframes fade-slide-3 {
          0% {
            opacity: 0;
            transform: translateY(4px) scale(0.9);
          }
          33% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          66% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          100% {
            opacity: 0.8;
            transform: translateY(-2px) scale(1.02);
          }
        }

        @keyframes sparkle-twinkle {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SlideGenerationLoader;
