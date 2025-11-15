import React from 'react';
import { CREDIT_PACKS } from '../config/pricing';
import { CreditPackage } from '../types';

interface OutOfCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (packageId: string) => void;
  currentBalance?: number;
}

const CreditPackCard: React.FC<{
  pack: CreditPackage;
  onSelect: () => void;
}> = ({ pack, onSelect }) => {
  const totalCredits = pack.credits + (pack.bonus || 0);
  const savings = pack.bonus ? Math.round((pack.bonus / pack.credits) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={`
        relative p-4 rounded-xl border-2 transition-all text-left
        hover:border-blue-500 hover:shadow-lg hover:scale-105
        ${pack.popular
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-md'
          : 'border-gray-200 bg-white'
        }
      `}
    >
      {/* Popular Badge */}
      {pack.popular && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-0.5 rounded-full text-xs font-semibold shadow-md">
            Most Popular
          </span>
        </div>
      )}

      {/* Bonus Badge */}
      {pack.bonus && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
            +{pack.bonus} FREE
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        {/* Package Name */}
        <h3 className="text-base font-bold text-gray-800 mb-2">{pack.name}</h3>

        {/* Credits */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-3xl font-bold text-blue-600">{pack.credits}</span>
          {pack.bonus && (
            <span className="text-lg font-semibold text-green-600">+{pack.bonus}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {totalCredits} credits total
        </p>

        {/* Price */}
        <div className="text-2xl font-bold text-gray-900 mb-1">
          ${pack.price}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          ${pack.pricePerCredit.toFixed(2)}/credit
        </p>

        {/* Savings Badge */}
        {savings > 0 && (
          <div className="mb-2">
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
              Save {savings}%
            </span>
          </div>
        )}

        {/* Best For */}
        {pack.bestFor && (
          <p className="text-xs text-gray-600 text-center mb-3">
            {pack.bestFor}
          </p>
        )}

        {/* Purchase Button */}
        <div
          className={`
            w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all
            ${pack.popular
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          Purchase
        </div>
      </div>
    </button>
  );
};

const OutOfCreditsModal: React.FC<OutOfCreditsModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  currentBalance = 0
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center px-8 pt-12 pb-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentBalance === 0 ? "You're out of credits!" : 'Not enough credits'}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {currentBalance === 0
              ? 'Purchase credits to continue creating amazing presentations with AI.'
              : `You have ${currentBalance} ${currentBalance === 1 ? 'credit' : 'credits'} remaining. Purchase more to keep creating.`}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">1 credit = 1 slide creation or edit</span>
          </div>
        </div>

        {/* Credit Packages Grid */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CREDIT_PACKS.map(pack => (
              <CreditPackCard
                key={pack.id}
                pack={pack}
                onSelect={() => onPurchase(pack.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 rounded-b-2xl border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Credits never expire</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure payment via Stripe</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutOfCreditsModal;
