"use client";

import { useState, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

/**
 * 🏛️ Rule #5 & #6: Specialist Schema Interface
 * Matched to AfriDamAi-Backend Specialist Model
 */
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  dateOfBirth: string;
  gender: string;
  password: string;
  medicalLicense: string;
  licenseExpiry: string;
  specialization: string; 
  yearsOfExperience: string;
  photo: File | null;
  photoPreview: string;
  licenseDocument: File | null; 
  identificationDocument: File | null;
}

export default function RegistrationForm() {
  const searchParams = useSearchParams();
  const specialty = searchParams.get("specialty");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    medicalLicense: "",
    licenseExpiry: "",
    specialization: specialty || "", 
    yearsOfExperience: "",
    photo: null,
    photoPreview: "",
    licenseDocument: null,
    identificationDocument: null,
  });

  const router = useRouter();

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: file,
        photoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleDocumentUpload = (
    e: ChangeEvent<HTMLInputElement>,
    fieldName: keyof FormData,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldName]: file }));
    }
  };

  const validateStep1 = (): boolean => {
    const requiredFields = ["firstName", "lastName", "email", "phoneNo", "password"];
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast.error(`Please fill in the ${field} field.`);
        return false;
      }
    }
    if (!formData.photo) {
      toast.error("Please upload your professional photo.");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const required = ["medicalLicense", "licenseExpiry", "specialization", "yearsOfExperience"];
    for (const field of required) {
      if (!formData[field as keyof FormData]) {
        toast.error(`Please provide your ${field}.`);
        return false;
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.licenseDocument || !formData.identificationDocument) {
      toast.error("Practicing License and ID are required.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true);

    try {
      const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = (error) => reject(error);
        });
      };

      const photoBase64 = formData.photo ? await convertToBase64(formData.photo) : "";
      const licenseDocBase64 = formData.licenseDocument ? await convertToBase64(formData.licenseDocument) : "";
      const idDocBase64 = formData.identificationDocument ? await convertToBase64(formData.identificationDocument) : "";

      // 🛡️ Rule #6: Match Specialist Model String[] requirement
      const documents = [
        `photo:${photoBase64}`,
        `license:${licenseDocBase64}`,
        `id:${idDocBase64}`,
        `specialization:${formData.specialization}` // Tagged for dashboard parsing
      ];

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNo: formData.phoneNo,
        sex: formData.gender,
        password: formData.password,
        documents: documents,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/specialist/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Registration Successful!");
        router.push("/dashboard");
      } else {
        const error = await response.json();
        toast.error(error.message || "Registration failed.");
      }
    } catch (error) {
      toast.error("Could not connect to local server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 italic transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 text-black dark:text-white tracking-tighter uppercase">SPECIALIST REGISTRATION</h1>
        </div>

        {/* Steps Bar */}
        <div className="flex items-center justify-between mb-12 px-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-all ${currentStep >= step ? "bg-black dark:bg-white text-white dark:text-black" : "bg-gray-200 dark:bg-gray-800 text-gray-400"}`}>
                {step}
              </div>
              {step < 3 && <div className={`flex-1 h-1 mx-2 ${currentStep > step ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-gray-800"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-800">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Personal Info</h3>
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 mb-4">
                  {formData.photoPreview ? (
                    <Image src={formData.photoPreview} alt="Preview" fill className="rounded-full object-cover border-4 border-[#FF7A59]" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-4 border-dashed border-gray-300 dark:border-gray-700">
                      <span className="text-4xl text-black dark:text-white">👤</span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer bg-[#FF7A59] text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition">
                  {formData.photo ? "Change Photo" : "Upload Photo *"}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="First Name *" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                <InputField label="Last Name *" name="lastName" value={formData.lastName} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Email *" name="email" value={formData.email} onChange={handleInputChange} type="email" />
                <InputField label="Phone Number *" name="phoneNo" value={formData.phoneNo} onChange={handleInputChange} type="tel" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Date of Birth *" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} type="date" />
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 focus:border-[#FF7A59] focus:outline-none transition bg-white dark:bg-gray-800 text-black dark:text-white font-bold italic">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <InputField label="Create Password *" name="password" value={formData.password} onChange={handleInputChange} type="password" />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Clinical Expertise</h3>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Primary Specialization *</label>
                <select name="specialization" value={formData.specialization} onChange={handleInputChange} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 focus:border-[#FF7A59] focus:outline-none transition bg-white dark:bg-gray-800 text-black dark:text-white font-bold italic">
                  <option value="">Select Specialization</option>
                  <option value="Registered Nurse">Registered Nurse</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Medical Officer">Medical Officer</option>
                  <option value="Skin Care Consultant">Skin Care Consultant</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Medical License #" name="medicalLicense" value={formData.medicalLicense} onChange={handleInputChange} />
                <InputField label="License Expiry *" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleInputChange} type="date" />
              </div>
              <InputField label="Years of Experience *" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleInputChange} type="number" />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Document Verification</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Valid Practicing License and Identification Required</p>
              
              <DocumentUpload 
                icon="📄" 
                title="Practicing License *" 
                file={formData.licenseDocument} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleDocumentUpload(e, "licenseDocument")} 
              />
              
              <DocumentUpload 
                icon="🪪" 
                title="Means of Identification *" 
                file={formData.identificationDocument} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleDocumentUpload(e, "identificationDocument")} 
              />
            </div>
          )}

          <div className="flex gap-4 mt-12">
            {currentStep > 1 && (
              <button onClick={handlePrevious} className="flex-1 py-5 rounded-full font-black text-xs uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">← Back</button>
            )}
            <button 
              onClick={currentStep < 3 ? handleNext : handleSubmit} 
              disabled={loading}
              className="flex-1 py-5 rounded-full font-black text-xs uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF7A59] dark:hover:bg-[#FF7A59] dark:hover:text-white transition shadow-xl"
            >
              {loading ? "Processing..." : currentStep < 3 ? "Next Step →" : "Finish Registration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🛡️ Reusable Components
function InputField({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <input {...props} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 focus:border-[#FF7A59] focus:outline-none transition bg-white dark:bg-gray-800 text-black dark:text-white font-bold italic shadow-sm placeholder:text-gray-200 dark:placeholder:text-gray-600" />
    </div>
  );
}

function DocumentUpload({ icon, title, file, onChange }: { 
  icon: string, 
  title: string, 
  file: File | null, 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void 
}) {
  return (
    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] p-8 hover:border-[#FF7A59] transition bg-white dark:bg-gray-800 shadow-sm">
      <label className="cursor-pointer block text-center">
        <div className="text-4xl mb-4 text-black dark:text-white">{icon}</div>
        <h4 className="font-black text-sm text-black dark:text-white uppercase tracking-tighter mb-2">{title}</h4>
        <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest">
          {file ? `✓ ${file.name}` : "Tap to upload document"}
        </p>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} className="hidden" />
      </label>
    </div>
  );
}