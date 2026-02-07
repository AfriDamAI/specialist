"use client";

import { useState, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface FormData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  password: string;
  address: string;
  country: string;
  city: string;
  state: string;
  zipCode: string;
  photo: File | null;
  photoPreview: string;

  // Step 2: Education & Professional
  medicalLicense: string;
  licenseExpiry: string;
  qualification: string;
  institution: string;
  graduationYear: string;
  specialization: string;
  yearsOfExperience: string;
  currentWorkplace: string;
  position: string;

  // Step 3: Documents
  licenseDocument: File | null;
  degreeDocument: File | null;
  certificationDocument: File | null;
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
    phone: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    address: "",
    country: "",
    city: "",
    state: "",
    zipCode: "",
    photo: null,
    photoPreview: "",
    medicalLicense: "",
    licenseExpiry: "",
    qualification: "",
    institution: "",
    graduationYear: "",
    specialization: specialty || "",
    yearsOfExperience: "",
    currentWorkplace: "",
    position: "",
    licenseDocument: null,
    degreeDocument: null,
    certificationDocument: null,
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
    setLoading(true);
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
      "password",
      "address",
      "country",
      "city",
      "state",
      "zipCode",
    ];

    // Check if all required fields are filled
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast.error(
          `Please fill in the ${field.replace(/([A-Z])/g, " $1").toLowerCase()} field.`,
        );
        setLoading(false);
        return false;
      }
    }

    // Check if photo is uploaded
    if (!formData.photo) {
      toast.error("Please upload your photo before proceeding.");
      setLoading(false);

      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      setLoading(false);

      return false;
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone) || formData.phone.length < 10) {
      toast.error("Please enter a valid phone number (at least 10 digits).");
      setLoading(false);

      return false;
    }

    // Validate password (minimum 8 characters)
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      setLoading(false);

      return false;
    }
    setLoading(false);

    return true;
  };

  const validateStep2 = (): boolean => {
    setLoading(true);

    const requiredFields = [
      "medicalLicense",
      "licenseExpiry",
      "qualification",
      "institution",
      "graduationYear",
      "specialization",
      "yearsOfExperience",
      "currentWorkplace",
      "position",
    ];

    // Check if all required fields are filled
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast.error(
          `Please fill in the ${field.replace(/([A-Z])/g, " $1").toLowerCase()} field.`,
        );
        setLoading(false);

        return false;
      }
    }

    // Validate graduation year
    const currentYear = new Date().getFullYear();
    const gradYear = parseInt(formData.graduationYear);
    if (isNaN(gradYear) || gradYear < 1950 || gradYear > currentYear) {
      toast.error(
        `Please enter a valid graduation year between 1950 and ${currentYear}.`,
      );
      setLoading(false);

      return false;
    }

    // Validate years of experience
    const experience = parseInt(formData.yearsOfExperience);
    if (isNaN(experience) || experience < 0 || experience > 60) {
      toast.error("Please enter a valid number of years of experience (0-60).");
      setLoading(false);

      return false;
    }

    // Validate license expiry is in the future
    const expiryDate = new Date(formData.licenseExpiry);
    const today = new Date();
    if (expiryDate <= today) {
      toast.error("License expiry date must be in the future.");
      setLoading(false);

      return false;
    }
    setLoading(false);

    return true;
  };

  const validateStep3 = (): boolean => {
    // Check required documents
    setLoading(true);

    if (!formData.licenseDocument) {
      toast.error("Please upload your Medical License Document.");
      setLoading(false);
      return false;
    }

    if (!formData.degreeDocument) {
      toast.error("Please upload your Degree Certificate.");
      setLoading(false);
      return false;
    }

    if (!formData.identificationDocument) {
      toast.error("Please upload your Government-Issued ID.");
      setLoading(false);
      return false;
    }

    // Validate file sizes (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;

    if (formData.licenseDocument.size > maxSize) {
      toast.error("Medical License Document must be less than 5MB.");
      setLoading(false);

      return false;
    }

    if (formData.degreeDocument.size > maxSize) {
      toast.error("Degree Certificate must be less than 5MB.");
      setLoading(false);

      return false;
    }

    if (formData.identificationDocument.size > maxSize) {
      toast.error("Government-Issued ID must be less than 5MB.");
      setLoading(false);

      return false;
    }

    if (
      formData.certificationDocument &&
      formData.certificationDocument.size > maxSize
    ) {
      toast.error("Professional Certifications must be less than 5MB.");
      setLoading(false);

      return false;
    }
    setLoading(false);

    return true;
  };

  const handleNext = () => {
    setLoading(true);

    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
      setLoading(false);
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Validate step 3 before submission
    if (!validateStep3()) {
      return;
    }

    try {
      toast.info("Submitting your application...");

      // Convert files to base64
      const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64String = reader.result as string;
            // Remove the data:image/png;base64, or data:application/pdf;base64, prefix
            resolve(base64String.split(",")[1]);
          };
          reader.onerror = (error) => reject(error);
        });
      };

      // Convert all files to base64
      const photoBase64 = formData.photo
        ? await convertToBase64(formData.photo)
        : "";
      const licenseDocBase64 = formData.licenseDocument
        ? await convertToBase64(formData.licenseDocument)
        : "";
      const degreeDocBase64 = formData.degreeDocument
        ? await convertToBase64(formData.degreeDocument)
        : "";
      const certDocBase64 = formData.certificationDocument
        ? await convertToBase64(formData.certificationDocument)
        : "";
      const idDocBase64 = formData.identificationDocument
        ? await convertToBase64(formData.identificationDocument)
        : "";

      // Create documents array with all additional info
      const documents = [
        JSON.stringify({
          type: "photo",
          data: photoBase64,
          filename: formData.photo?.name,
        }),
        JSON.stringify({
          type: "personal_info",
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          country: formData.country,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        }),
        JSON.stringify({
          type: "professional_info",
          medicalLicense: formData.medicalLicense,
          licenseExpiry: formData.licenseExpiry,
          qualification: formData.qualification,
          institution: formData.institution,
          graduationYear: formData.graduationYear,
          specialization: formData.specialization,
          yearsOfExperience: formData.yearsOfExperience,
          currentWorkplace: formData.currentWorkplace,
          position: formData.position,
        }),
        JSON.stringify({
          type: "license_document",
          data: licenseDocBase64,
          filename: formData.licenseDocument?.name,
        }),
        JSON.stringify({
          type: "degree_document",
          data: degreeDocBase64,
          filename: formData.degreeDocument?.name,
        }),
        JSON.stringify({
          type: "identification_document",
          data: idDocBase64,
          filename: formData.identificationDocument?.name,
        }),
      ];

      // Add certification document if provided
      if (formData.certificationDocument && certDocBase64) {
        documents.push(
          JSON.stringify({
            type: "certification_document",
            data: certDocBase64,
            filename: formData.certificationDocument.name,
          }),
        );
      }

      // Prepare API payload
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNo: formData.phone,
        sex: formData.gender,
        password: formData.password,
        documents: documents,
      };

      // Send to API
      const response = await fetch(
        "https://afridamai-backend.onrender.com/api/specialists",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setLoading(false);
        router.push("/dashboard");
        toast.success("Application submitted successfully!");
        
      } else {
        toast.error(
          data.message || "Failed to submit application. Please try again.",
        );
        setLoading
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        "An error occurred while submitting your application. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          
          <h1 className="text-4xl font-black mb-2">
            <span className="text-black">SPECIALIST</span>
          </h1>
          <h2 className="text-4xl font-black text-[#FF7A59]">REGISTRATION</h2>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12 px-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  currentStep >= step
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all ${
                    currentStep > step ? "bg-black" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Personal Information
              </h3>

              {/* Photo Upload */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 mb-4">
                  {formData.photoPreview ? (
                    <Image
                      src={formData.photoPreview}
                      alt="Profile preview"
                      fill
                      className="rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                      <span className="text-4xl text-gray-400">👤</span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer bg-[#FF7A59] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#ff6a49] transition">
                  {formData.photo ? "Change Photo" : "Upload Photo *"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {formData.photo && (
                  <p className="text-sm text-green-600 mt-2 font-semibold">
                    ✓ Photo uploaded
                  </p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                  required
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                  required
                >
                  <option value="">Select Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Ghana">Ghana</option>
                  <option value="India">India</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Spain">Spain</option>
                  <option value="Italy">Italy</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Norway">Norway</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Finland">Finland</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Austria">Austria</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Poland">Poland</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Hungary">Hungary</option>
                  <option value="Romania">Romania</option>
                  <option value="Greece">Greece</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Morocco">Morocco</option>
                  <option value="Tunisia">Tunisia</option>
                  <option value="Algeria">Algeria</option>
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Botswana">Botswana</option>
                  <option value="Namibia">Namibia</option>
                  <option value="Zimbabwe">Zimbabwe</option>
                  <option value="Zambia">Zambia</option>
                  <option value="Mauritius">Mauritius</option>
                  <option value="Senegal">Senegal</option>
                  <option value="Ivory Coast">Ivory Coast</option>
                  <option value="Cameroon">Cameroon</option>
                  <option value="China">China</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Philippines">Philippines</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="Nepal">Nepal</option>
                  <option value="United Arab Emirates">
                    United Arab Emirates
                  </option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="Bahrain">Bahrain</option>
                  <option value="Oman">Oman</option>
                  <option value="Jordan">Jordan</option>
                  <option value="Lebanon">Lebanon</option>
                  <option value="Israel">Israel</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Chile">Chile</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Peru">Peru</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Costa Rica">Costa Rica</option>
                  <option value="Panama">Panama</option>
                  <option value="Jamaica">Jamaica</option>
                  <option value="Trinidad and Tobago">
                    Trinidad and Tobago
                  </option>
                  <option value="Barbados">Barbados</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Fiji">Fiji</option>
                  <option value="Papua New Guinea">Papua New Guinea</option>
                  <option value="Russia">Russia</option>
                  <option value="Ukraine">Ukraine</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Zip/Postal Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Education & Professional Data */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Education & Professional Information
              </h3>

              {/* License Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Medical License Number *
                  </label>
                  <input
                    type="text"
                    name="medicalLicense"
                    value={formData.medicalLicense}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    License Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    value={formData.licenseExpiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Highest Qualification *
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder="e.g., MBBS, MD, BSN"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Institution *
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Graduation Year *
                  </label>
                  <input
                    type="text"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    placeholder="YYYY"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Specialization *
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                  required
                />
              </div>

              {/* Professional Experience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Workplace *
                  </label>
                  <input
                    type="text"
                    name="currentWorkplace"
                    value={formData.currentWorkplace}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Document Upload
              </h3>
              <p className="text-gray-600 mb-6">
                Please upload the following documents (PDF or image format, max
                5MB each)
              </p>

              {/* License Document */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#FF7A59] transition">
                <label className="cursor-pointer block">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Medical License Document *
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {formData.licenseDocument
                        ? `✓ ${formData.licenseDocument.name}`
                        : "Click to upload or drag and drop"}
                    </p>
                    {formData.licenseDocument && (
                      <p className="text-xs text-green-600 font-semibold">
                        {(formData.licenseDocument.size / 1024 / 1024).toFixed(
                          2,
                        )}{" "}
                        MB
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocumentUpload(e, "licenseDocument")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Degree Document */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#FF7A59] transition">
                <label className="cursor-pointer block">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎓</div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Degree Certificate *
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {formData.degreeDocument
                        ? `✓ ${formData.degreeDocument.name}`
                        : "Click to upload or drag and drop"}
                    </p>
                    {formData.degreeDocument && (
                      <p className="text-xs text-green-600 font-semibold">
                        {(formData.degreeDocument.size / 1024 / 1024).toFixed(
                          2,
                        )}{" "}
                        MB
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocumentUpload(e, "degreeDocument")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Certification Document */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#FF7A59] transition">
                <label className="cursor-pointer block">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📜</div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Professional Certifications
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {formData.certificationDocument
                        ? `✓ ${formData.certificationDocument.name}`
                        : "Click to upload or drag and drop (Optional)"}
                    </p>
                    {formData.certificationDocument && (
                      <p className="text-xs text-green-600 font-semibold">
                        {(
                          formData.certificationDocument.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleDocumentUpload(e, "certificationDocument")
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {/* ID Document */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#FF7A59] transition">
                <label className="cursor-pointer block">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🪪</div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Government-Issued ID *
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {formData.identificationDocument
                        ? `✓ ${formData.identificationDocument.name}`
                        : "Click to upload or drag and drop"}
                    </p>
                    {formData.identificationDocument && (
                      <p className="text-xs text-green-600 font-semibold">
                        {(
                          formData.identificationDocument.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleDocumentUpload(e, "identificationDocument")
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="flex-1 py-4 px-6 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
              >
                ← PREVIOUS
              </button>
            )}
            {currentStep < 3 ? (
              <>
                {loading ? (
                  <div className="flex-1 py-4 px-6 rounded-full font-bold text-white bg-gray-500 cursor-not-allowed">
                    Loading...
                  </div>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-4 px-6 rounded-full cursor-pointer font-bold text-white bg-black hover:bg-[#ff6a49] transition"
                  >
                    NEXT →
                  </button>
                )}
              </>
            ) : (

              <button
                onClick={handleSubmit}
                className="flex-1 py-4 px-6 rounded-full font-bold text-white bg-[#FF7A59] hover:bg-[#ff6a49] transition"
              >
                SUBMIT APPLICATION"
              </button>
            )}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Step {currentStep} of 3
        </div>
      </div>
    </div>
  );
}
