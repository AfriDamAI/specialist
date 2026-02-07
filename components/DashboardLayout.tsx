'use client';

import { useState } from 'react';
import Image from 'next/image';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Sample user data - replace with actual user data from your auth system
  const user = {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'Dermatologist',
    avatar: '/avatar-placeholder.jpg', // Replace with actual avatar
  };

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { id: 'appointments', icon: '📅', label: 'Appointments', href: '/appointments' },
    { id: 'patients', icon: '👥', label: 'Patients', href: '/patients' },
    { id: 'consultations', icon: '💬', label: 'Consultations', href: '/consultations' },
    { id: 'schedule', icon: '🕒', label: 'My Schedule', href: '/schedule' },
    { id: 'analytics', icon: '📈', label: 'Analytics', href: '/analytics' },
    { id: 'documents', icon: '📄', label: 'Documents', href: '/documents' },
    { id: 'settings', icon: '⚙️', label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* Left Section - Logo & Menu Toggle */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold italic">A</span>
              </div>
              <span className="hidden sm:block text-xl font-black text-gray-900">
                Afridam<span className="text-[#FF7A59]">AI</span>
              </span>
            </div>
          </div>

          {/* Right Section - Search, Notifications, Profile */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Bar - Hidden on mobile */}
            <div className="hidden lg:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
                  className="w-64 xl:w-80 px-4 py-2 pl-10 rounded-full border-2 border-gray-200 focus:border-[#FF7A59] focus:outline-none transition bg-gray-50"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Search Icon - Mobile only */}
            <button className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {/* Notification Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF7A59] rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7A59] to-[#ff6a49] flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-6 px-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveMenu(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeMenu === item.id
                        ? 'bg-gradient-to-r from-[#FF7A59] to-[#ff6a49] text-white shadow-lg shadow-[#FF7A59]/30'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Section - Help & Logout */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition">
              <span className="text-xl">❓</span>
              <span className="text-sm">Help & Support</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition">
              <span className="text-xl">🚪</span>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="pt-16 md:pl-64">
        <div className="p-4 md:p-6 lg:p-8">
          {children || (
            <div className="text-center py-12">
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                Welcome to your Dashboard
              </h1>
              <p className="text-gray-600">
                Your main content will appear here
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}