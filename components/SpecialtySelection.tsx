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
          ? 'border-[#FF7A59] bg-[#FFF5F2]'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

export default function SpecialtySelection() {
  const router = useRouter();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const specialties = [
    {
      id: 'dermatologist',
      title: 'Dermatologists',
      description: 'Specialized doctors in skin, hair, and nail conditions',
      icon: '👨‍⚕️',
    },
    {
      id: 'medical-officer',
      title: 'Medical Officers',
      description: 'Licensed medical practitioners providing general healthcare',
      icon: '🩺',
    },
    {
      id: 'registered-nurse',
      title: 'Registered Nurses',
      description: 'Qualified nurses providing patient care and support',
      icon: '👩‍⚕️',
    },
    {
      id: 'skincare-consultant',
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          
          <h1 className="text-5xl font-black mb-2">
            <span className="text-black">WELCOME</span>
          </h1>
          <h2 className="text-5xl font-black text-[#FF7A59] mb-4">ABOARD.</h2>
          <p className="text-gray-600 text-lg">
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
              ? 'bg-black hover:bg-gray-800'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          CONTINUE
          <span>→</span>
        </button>
      </div>
    </div>
  );
}