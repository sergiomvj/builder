'use client';

import { useState } from 'react';

export default function SimpleDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">BuildCorp Dashboard (Simple)</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['home', 'empresas', 'personas', 'avatars', 'diversidade'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tab: {activeTab}</h2>
          <p>This is a simplified dashboard to test for infinite loops.</p>
          <p>Current active tab: <strong>{activeTab}</strong></p>
          
          {activeTab === 'diversidade' && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h3 className="font-medium">Diversidade Tab</h3>
              <p>This tab should not cause infinite loops now.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}