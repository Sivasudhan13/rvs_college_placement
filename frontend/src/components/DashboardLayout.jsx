import React, { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardNavbar from './DashboardNavbar';

/**
 * Shared shell used by every dashboard sub-page.
 * Props:
 *   children  – main content
 */
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardNavbar onMenuToggle={() => setSidebarOpen((v) => !v)} />

        {/* Scrollable area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-gray-700">RVS CET</p>
              <p className="text-[10px] text-gray-400">
                © 2024 RVS College of Engineering &amp; Technology. All rights reserved.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              {['Privacy Policy', 'Terms of Service', 'Campus Map', 'Contact'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[11px] text-gray-500 hover:text-primary hover:underline whitespace-nowrap"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
