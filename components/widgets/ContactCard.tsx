/**
 * ContactCard Widget - Professional rep contact display
 *
 * Inspired by Dock.us and Trumpet design patterns.
 * Shows rep photo, name, title, email, phone, and calendar booking.
 */

import React from 'react';

interface ContactCardProps {
  name: string;
  title: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  calendlyUrl?: string;
  linkedInUrl?: string;
  companyName?: string;
  companyLogo?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
  name,
  title,
  email,
  phone,
  photoUrl,
  calendlyUrl,
  linkedInUrl,
  companyName,
  companyLogo
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        {/* Company logo */}
        {companyLogo && (
          <div className="mb-4">
            <img src={companyLogo} alt={companyName} className="h-6 opacity-80" />
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-2xl font-bold">
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{name}</h3>
            <p className="text-sm text-indigo-200 truncate">{title}</p>
            {companyName && !companyLogo && (
              <p className="text-xs text-slate-400 mt-0.5">{companyName}</p>
            )}
          </div>
        </div>

        {/* Contact methods */}
        <div className="mt-5 space-y-2">
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group"
          >
            <svg className="w-4 h-4 text-indigo-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-slate-200 group-hover:text-white truncate">{email}</span>
          </a>

          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group"
            >
              <svg className="w-4 h-4 text-indigo-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-slate-200 group-hover:text-white">{phone}</span>
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex gap-3">
          {calendlyUrl && (
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/25"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book a Call
            </a>
          )}

          {linkedInUrl && (
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-[#0A66C2] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          )}
        </div>

        {/* Availability indicator */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Usually responds within 2 hours
        </div>
      </div>
    </div>
  );
};

export default ContactCard;
