"use client";

import { useState, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

/**
 * 🏛️ Rule #5 & #6: Specialist Schema Interface
 * Matched to AfriDamAi-Backend Specialist Model
 */
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  gender: string;
  password: string;
  specialization: string;
  photo: File | null;
  photoPreview: string;
  licenseDocument: File | null;
  identificationDocument: File | null;
}

export default function RegistrationForm() {
  const searchParams = useSearchParams();
  const specialty = searchParams.get("specialty");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
    gender: "",
    password: "",
    specialization: specialty || "SKINCARE_CONSULTANT",
    photo: null,
    photoPreview: "",
    licenseDocument: null,
    identificationDocument: null,
  });

  const router = useRouter();

  const BASE_URL = API_URL;

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

  const validateForm = (): boolean => {
    const requiredFields = ["firstName", "lastName", "email", "phoneNo", "password", "gender", "specialization"];
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast.error(`Please fill in the ${field} field.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
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

      const documents = [];
      if (licenseDocBase64) documents.push(`license:${licenseDocBase64}`);
      if (idDocBase64) documents.push(`id:${idDocBase64}`);

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNo: formData.phoneNo,
        sex: formData.gender.toUpperCase(),
        password: formData.password,
        documents: documents,
        avatarUrl: photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : "",
        type: formData.specialization,
      };

      const response = await fetch(`${BASE_URL}/auth/specialist/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Registration Successful! Please log in.");
        router.push("/login");
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
    <div className="bg-white p-2 italic">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-4">
            {formData.photoPreview ? (
              <Image src={formData.photoPreview} alt="Preview" fill className="rounded-full object-cover border-4 border-[#FF7A59]" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-[#FF7A59] transition-colors">
                <span className="text-3xl grayscale opacity-30">👤</span>
              </div>
            )}
          </div>
          <label className="cursor-pointer bg-black text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FF7A59] transition-all active:scale-95 shadow-lg">
            {formData.photo ? "Change Portrait" : "Upload Avatar"}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" />
          <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Clinical Email" name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="doctor@afridam.ai" />
          <InputField label="Phone Number" name="phoneNo" value={formData.phoneNo} onChange={handleInputChange} type="tel" placeholder="+234..." />
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Sex</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-6 py-4 rounded-2xl border-none bg-gray-50 focus:ring-2 focus:ring-[#FF7A59] outline-none transition font-bold text-sm">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Specialist Type</label>
            <select name="specialization" value={formData.specialization} onChange={handleInputChange} className="w-full px-6 py-4 rounded-2xl border-none bg-gray-50 focus:ring-2 focus:ring-[#FF7A59] outline-none transition font-bold text-sm">
              <option value="SKINCARE_CONSULTANT">Skin Care Consultant</option>
              <option value="DERMATOLOGIST">Dermatologist</option>
              <option value="MEDICAL_OFFICER">Medical Officer</option>
              <option value="REGISTERED_NURSE">Registered Nurse</option>
            </select>
          </div>
        </div>

        <InputField label="Security Key" name="password" value={formData.password} onChange={handleInputChange} type="password" placeholder="••••••••" />

        {/* Document Section (Horizontal Flow) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentQuickUpload
            title="Professional License"
            file={formData.licenseDocument}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleDocumentUpload(e, "licenseDocument")}
          />
          <DocumentQuickUpload
            title="ID / Passport"
            file={formData.identificationDocument}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleDocumentUpload(e, "identificationDocument")}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-black text-white hover:bg-[#FF7A59] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Registering Specialist..." : "Join Workspace"}
        </button>
      </form>
    </div>
  );
}

// 🛡️ Premium UI Atoms
function InputField({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <input {...props} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 focus:border-[#FF7A59] focus:outline-none transition bg-white dark:bg-gray-800 text-black dark:text-white font-bold italic shadow-sm placeholder:text-gray-200 dark:placeholder:text-gray-600" />
    </div>
  );
}

function DocumentQuickUpload({ title, file, onChange }: {
  title: string,
  file: File | null,
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] p-8 hover:border-[#FF7A59] transition bg-white dark:bg-gray-800 shadow-sm">
      <label className="cursor-pointer block text-center">
        <div className="text-4xl mb-4 text-black dark:text-white"></div>
        <h4 className="font-black text-sm text-black dark:text-white uppercase tracking-tighter mb-2">{title}</h4>
        <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest">
          {file ? `✓ ${file.name}` : "Tap to upload document"}
        </p>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} className="hidden" />
      </label>
    </div>
  );
}