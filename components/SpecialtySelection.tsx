'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SpecialtyCardProps {
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

const SpecialtyCard: React.FC<SpecialtyCardProps> = ({
  title,
  description,
  icon,
  isSelected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 ${
        isSelected
          ? 'border-[#FF7A59] bg-[#FFF5F2] dark:bg-[#FF7A59]/10'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default function SpecialtySelection() {
  const router = useRouter();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const specialties = [
    {
      id: 'DERMATOLOGIST',
      title: 'Dermatologists',
      description: 'Specialized doctors in skin, hair, and nail conditions',
      icon: '👨‍⚕️',
    },
    {
      id: 'MEDICAL_OFFICER',
      title: 'Medical Officers',
      description: 'Licensed medical practitioners providing general healthcare',
      icon: '🩺',
    },
    {
      id: 'REGISTERED_NURSE',
      title: 'Registered Nurses',
      description: 'Qualified nurses providing patient care and support',
      icon: '👩‍⚕️',
    },
    {
      id: 'CONSULTANT',
      title: 'Skincare Consultants',
      description: 'Experts in skincare treatments and product recommendations',
      icon: '💆‍♀️',
    },
  ];

  const handleContinue = () => {
    if (selectedSpecialty) {
      router.push(`/register?specialty=${selectedSpecialty}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          
          <h1 className="text-5xl font-black mb-2">
            <span className="text-black dark:text-white">WELCOME</span>
          </h1>
          <h2 className="text-5xl font-black text-[#FF7A59] mb-4">ABOARD.</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Select your specialty to begin registration
          </p>
        </div>

        {/* Specialty Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {specialties.map((specialty) => (
            <SpecialtyCard
              key={specialty.id}
              title={specialty.title}
              description={specialty.description}
              icon={specialty.icon}
              isSelected={selectedSpecialty === specialty.id}
              onClick={() => setSelectedSpecialty(specialty.id)}
            />
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedSpecialty}
          className={`w-full py-4 px-6 rounded-full font-bold text-white text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            selectedSpecialty
              ? 'bg-black dark:bg-white dark:text-black hover:opacity-90'
              : 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed text-gray-500'
          }`}
        >
          CONTINUE
          <span>→</span>
        </button>
      </div>
    </div>
  );
}