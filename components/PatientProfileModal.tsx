'use client';

import { XMarkIcon, UserIcon, ShieldCheckIcon, BeakerIcon, ExclamationTriangleIcon, CalendarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { PatientProfile } from '../app/chat/types/chat';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: PatientProfile;
  patientName: string;
}

export default function PatientProfileModal({ isOpen, onClose, profile, patientName }: PatientProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-[#FF7A59]/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7A59] flex items-center justify-center text-white shadow-lg shadow-[#FF7A59]/20">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{patientName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clinical Profile</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {!profile ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No detailed profile information available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info & Concerns */}
              <div className="space-y-6">
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#FF7A59] uppercase tracking-wider mb-4">
                    <SparklesIcon className="w-4 h-4" />
                    Clinical Summary
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 space-y-4">
                    <InfoRow label="Age Range" value={profile.ageRange ? `${profile.ageRange} years` : 'Not specified'} />
                    <InfoRow label="Skin Type" value={profile.skinType || 'Not specified'} />
                    <InfoRow label="Melanin Tone" value={profile.melaninTone || 'Not specified'} />
                    <InfoRow label="Primary Concern" value={profile.primaryConcern || 'General Consultation'} />
                  </div>
                </section>

                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#FF7A59] uppercase tracking-wider mb-4">
                    <ShieldCheckIcon className="w-4 h-4" />
                    Environment & Sensitivities
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 space-y-4">
                    <InfoRow label="Environment" value={profile.environment || 'Not specified'} />
                    <InfoRow label="Allergies" value={profile.allergies || 'None reported'} isWarning={!!profile.allergies} />
                  </div>
                </section>
              </div>

              {/* History & Treatments */}
              <div className="space-y-6">
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#FF7A59] uppercase tracking-wider mb-4">
                    <BeakerIcon className="w-4 h-4" />
                    Past Treatments
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
                    {profile.previousTreatment && profile.previousTreatment.length > 0 ? (
                      <ul className="space-y-2">
                        {profile.previousTreatment.map((t, i) => (
                          <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A59] mt-1.5" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No previous treatments recorded.</p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#FF7A59] uppercase tracking-wider mb-4">
                    <CalendarIcon className="w-4 h-4" />
                    Analyzer History
                  </h3>
                  <div className="space-y-3">
                    {profile.skinHistory && profile.skinHistory.length > 0 ? (
                      profile.skinHistory.map((scan) => (
                        <div key={scan.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(scan.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Object.keys(scan.predictions || {}).length} conditions detected
                            </p>
                          </div>
                          <div className="text-xs font-bold text-[#FF7A59] bg-[#FF7A59]/10 px-2 py-1 rounded-lg uppercase">
                            View Scan
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-center">
                        <p className="text-sm text-gray-500">No analyzer history yet.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:opacity-90 transition-opacity active:scale-95"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, isWarning = false }: { label: string; value: string; isWarning?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-tight">{label}</span>
      <span className={`text-sm font-semibold ${isWarning ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}
