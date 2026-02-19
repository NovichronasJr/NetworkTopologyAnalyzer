// "use client"
// import { useState, useEffect } from 'react';
// import { useUser } from '../../../context/userContext';

// export default function ProfilePage() {
//   const { userName, userEmail } = useUser() || {};
//   const [isEditing, setIsEditing] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [imagePreview, setImagePreview] = useState(null);
  
//   const [formData, setFormData] = useState({
//     // Personal Information
//     fullName: userName,
//     email: userEmail,
//     phone: '',
//     jobTitle: '',
//     profileImage: null,
    
//     // Organization Information
//     organizationName: '',
//     organizationType: 'corporate',
//     organizationSize: 'medium',
//     department: '',
    
//     // Network Configuration
//     primaryNetworkType: 'wired',
//     networkScale: 'medium',
//     ipRanges: '',
//   });

//   useEffect(() => {
//     loadProfileData();
//   }, []);

//   const loadProfileData = async () => {
//     try {
//       const response = await fetch(`http://localhost:8003/api/profile/${encodeURIComponent(userEmail)}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         },
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setFormData(data);
//         if (data.profileImage) {
//           setImagePreview(data.profileImage);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load profile:', error);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFormData(prev => ({ ...prev, profileImage: file }));
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const formDataToSend = new FormData();
//       Object.keys(formData).forEach(key => {
//         if (formData[key] !== null && formData[key] !== undefined) {
//           formDataToSend.append(key, formData[key]);
//         }
//       });

//       const response = await fetch('http://localhost:8003/api/profile', {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         },
//         body: formDataToSend,
//       });

//       if (response.ok) {
//         setIsEditing(false);
//         alert('Profile updated successfully!');
//         loadProfileData();
//       } else {
//         alert('Failed to update profile');
//       }
//     } catch (error) {
//       console.error('Failed to update profile:', error);
//       alert('Failed to update profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#0a1628] p-6">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-[#19d5ff] mb-2">User Profile</h1>
//           <p className="text-gray-400">Manage your network topology analyzer account settings</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Profile Overview Card */}
//           <div className="bg-[#0b1f33] border border-[#19d5ff33] rounded-lg p-6">
//             <div className="flex items-start justify-between mb-6">
//               <h2 className="text-xl font-semibold text-[#19d5ff]">Profile Overview</h2>
//               {!isEditing ? (
//                 <button
//                   type="button"
//                   onClick={() => setIsEditing(true)}
//                   className="px-4 py-2 bg-[#19d5ff] text-[#0b1f33] rounded-md font-semibold hover:bg-[#15b8db] transition-colors"
//                 >
//                   Edit Profile
//                 </button>
//               ) : (
//                 <div className="flex gap-2">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setIsEditing(false);
//                       loadProfileData();
//                     }}
//                     className="px-4 py-2 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
//                   >
//                     {loading ? 'Saving...' : 'Save Changes'}
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Profile Image */}
//             <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#19d5ff22]">
//               <div className="relative">
//                 <div className="w-24 h-24 rounded-full bg-[#19d5ff22] border-2 border-[#19d5ff] overflow-hidden flex items-center justify-center">
//                   {imagePreview ? (
//                     <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
//                   ) : (
//                     <svg className="w-12 h-12 text-[#19d5ff]" fill="currentColor" viewBox="0 0 24 24">
//                       <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
//                     </svg>
//                   )}
//                 </div>
//                 {isEditing && (
//                   <label className="absolute bottom-0 right-0 bg-[#19d5ff] text-[#0b1f33] rounded-full p-2 cursor-pointer hover:bg-[#15b8db] transition-colors">
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
//                     </svg>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageChange}
//                       className="hidden"
//                     />
//                   </label>
//                 )}
//               </div>
//               <div>
//                 <h3 className="text-xl font-semibold text-white">{formData.fullName || 'Network Administrator'}</h3>
//                 <p className="text-gray-400">{formData.email || userEmail}</p>
//                 <p className="text-sm text-[#19d5ff] mt-1">{formData.jobTitle || 'Network Engineer'}</p>
//               </div>
//             </div>

//             {/* Personal Information */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
//                 <input
//                   type="text"
//                   name="fullName"
//                   value={formData.fullName}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   required
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="John Doe"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   required
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="john@company.com"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="+1 (555) 000-0000"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Job Title *</label>
//                 <input
//                   type="text"
//                   name="jobTitle"
//                   value={formData.jobTitle}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   required
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="Network Administrator"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Organization Information */}
//           <div className="bg-[#0b1f33] border border-[#19d5ff33] rounded-lg p-6">
//             <h2 className="text-xl font-semibold text-[#19d5ff] mb-6 flex items-center gap-2">
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//               </svg>
//               Organization Details
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Organization Name *</label>
//                 <input
//                   type="text"
//                   name="organizationName"
//                   value={formData.organizationName}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   required
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="Acme Corporation"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
//                 <input
//                   type="text"
//                   name="department"
//                   value={formData.department}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="IT & Infrastructure"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Organization Type *</label>
//                 <select
//                   name="organizationType"
//                   value={formData.organizationType}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   required
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <option value="corporate">Corporate</option>
//                   <option value="educational">Educational</option>
//                   <option value="government">Government</option>
//                   <option value="healthcare">Healthcare</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Organization Size *</label>
//                 <select
//                   name="organizationSize"
//                   value={formData.organizationSize}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   required
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <option value="small">Small (1-50 employees)</option>
//                   <option value="medium">Medium (51-500 employees)</option>
//                   <option value="large">Large (501-2000 employees)</option>
//                   <option value="enterprise">Enterprise (2000+ employees)</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Network Configuration */}
//           <div className="bg-[#0b1f33] border border-[#19d5ff33] rounded-lg p-6">
//             <h2 className="text-xl font-semibold text-[#19d5ff] mb-6 flex items-center gap-2">
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
//               </svg>
//               Network Configuration
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Primary Network Type *</label>
//                 <select
//                   name="primaryNetworkType"
//                   value={formData.primaryNetworkType}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   required
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <option value="wired">Wired Network</option>
//                   <option value="wireless">Wireless Network</option>
//                   <option value="hybrid">Hybrid (Wired + Wireless)</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">Network Scale *</label>
//                 <select
//                   name="networkScale"
//                   value={formData.networkScale}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   required
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <option value="small">Small (&lt;50 devices)</option>
//                   <option value="medium">Medium (50-500 devices)</option>
//                   <option value="large">Large (500-2000 devices)</option>
//                   <option value="enterprise">Enterprise (2000+ devices)</option>
//                 </select>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   IP Address Ranges
//                   <span className="text-xs text-gray-500 ml-2">(Optional - Comma separated)</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="ipRanges"
//                   value={formData.ipRanges}
//                   onChange={handleInputChange}
//                   disabled={!isEditing}
//                   className="w-full px-4 py-2 bg-[#0a1628] border border-[#19d5ff33] rounded-md text-white font-mono focus:outline-none focus:border-[#19d5ff] disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="192.168.1.0/24, 10.0.0.0/16"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Save Button (Mobile) */}
//           {isEditing && (
//             <div className="flex gap-2 md:hidden">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setIsEditing(false);
//                   loadProfileData();
//                 }}
//                 className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
//               >
//                 {loading ? 'Saving...' : 'Save Changes'}
//               </button>
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// }

"use client"
import { useState, useEffect } from 'react';
import { useUser } from '../../../context/userContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { userName, userEmail } = useUser() || {};
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: userName,
    email: userEmail,
    phone: '',
    jobTitle: '',
    profileImage: null,
    organizationName: '',
    organizationType: 'corporate',
    organizationSize: 'medium',
    department: '',
    primaryNetworkType: 'wired',
    networkScale: 'medium',
    ipRanges: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await fetch(`http://localhost:8003/api/profile/${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
        if (data.profileImage) {
          setImagePreview(data.profileImage);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch('http://localhost:8003/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        setIsEditing(false);
        alert('Profile updated successfully!');
        loadProfileData();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06121f] text-white p-8 pt-24 selection:bg-[#19d5ff33]">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Branding */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-[#19d5ff11] pb-10">
          <div>
            <h1 className="text-5xl font-black text-[#19d5ff] italic tracking-tighter uppercase">Account Profile</h1>
            <p className="text-gray-500 font-medium mt-2 tracking-wide uppercase text-xs">Manage your topology analyzer credentials</p>
          </div>
          <div className="mt-6 md:mt-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-[#19d5ff] text-[#06121f] px-8 py-3 rounded-xl font-black uppercase italic text-sm hover:shadow-[0_0_20px_rgba(25,213,255,0.4)] transition-all"
              >
                Edit Parameters
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); loadProfileData(); }}
                  className="px-6 py-3 bg-[#0b1f33] border border-[#19d5ff33] text-white rounded-xl font-bold uppercase italic text-xs hover:bg-[#11243d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="profile-form"
                  disabled={loading}
                  className="px-6 py-3 bg-green-500 text-[#06121f] rounded-xl font-black uppercase italic text-xs hover:bg-green-400 disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  {loading ? 'Synchronizing...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        <form id="profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Overview & Image */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-[#0b1f33] border border-[#19d5ff11] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-20 h-20 text-[#19d5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full bg-[#06121f] border-2 border-[#19d5ff] shadow-[0_0_20px_rgba(25,213,255,0.2)] overflow-hidden flex items-center justify-center group">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-16 h-16 text-[#19d5ff] opacity-40" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            )}
                        </div>
                        {isEditing && (
                            <label className="absolute bottom-0 right-0 bg-[#19d5ff] text-[#06121f] rounded-full p-3 cursor-pointer hover:scale-110 transition-all shadow-lg border-2 border-[#06121f]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                </svg>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter line-clamp-1">{formData.fullName || 'User Name'}</h3>
                    <p className="text-[#19d5ff] font-mono text-xs uppercase mt-1 tracking-widest">{formData.jobTitle || 'Identity Unverified'}</p>
                    <div className="mt-6 pt-6 border-t border-[#19d5ff11] w-full text-left space-y-4">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <span>Network Node</span>
                            <span className="text-[#19d5ff]">Active</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <span>Status</span>
                            <span className="text-green-400 italic">Synchronized</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Form Data */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal & Organizational Info */}
            <div className="bg-[#0b1f33] border border-[#19d5ff11] rounded-[2rem] p-8 shadow-xl">
              <h2 className="text-[10px] font-black text-[#19d5ff] uppercase tracking-[0.2em] mb-8 italic">Personnel & Infrastructure Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Identity Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} disabled={!isEditing} required className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 focus:border-[#19d5ff] outline-none transition-all disabled:opacity-30" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Secure Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} required className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 focus:border-[#19d5ff] outline-none transition-all disabled:opacity-30 font-mono text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Organization Alias</label>
                    <input type="text" name="organizationName" value={formData.organizationName} onChange={handleInputChange} disabled={!isEditing} required className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 focus:border-[#19d5ff] outline-none transition-all disabled:opacity-30" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Org Type</label>
                    <select name="organizationType" value={formData.organizationType} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 focus:border-[#19d5ff] outline-none transition-all disabled:opacity-30 appearance-none">
                        <option value="corporate">Corporate</option>
                        <option value="educational">Educational</option>
                        <option value="government">Government</option>
                        <option value="healthcare">Healthcare</option>
                    </select>
                </div>
              </div>
            </div>

            {/* Network Configuration */}
            <div className="bg-[#0b1f33] border border-[#19d5ff11] rounded-[2rem] p-8 shadow-xl">
              <h2 className="text-[10px] font-black text-[#19d5ff] uppercase tracking-[0.2em] mb-8 italic">Network Operations Parameters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Primary Topology</label>
                    <select name="primaryNetworkType" value={formData.primaryNetworkType} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 focus:border-[#19d5ff] outline-none transition-all disabled:opacity-30">
                        <option value="wired">Wired / Ethernet</option>
                        <option value="wireless">Wireless / WLAN</option>
                        <option value="hybrid">Hybrid Deployment</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Infrastructure Scale</label>
                    <select name="networkScale" value={formData.networkScale} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 focus:border-[#19d5ff] outline-none transition-all disabled:opacity-30">
                        <option value="small">Small (&lt;50 nodes)</option>
                        <option value="medium">Medium (50-500 nodes)</option>
                        <option value="large">Large (500-2000 nodes)</option>
                    </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">IP Address Ranges (Comma Separated)</label>
                <input type="text" name="ipRanges" value={formData.ipRanges} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 focus:border-[#19d5ff] outline-none transition-all disabled:opacity-30 font-mono text-xs text-[#19d5ff]" placeholder="192.168.1.0/24, 10.0.0.0/16" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}