'use client'

import dynamic from 'next/dynamic'

const StlUploader = dynamic(() => import('./StlUploader'), {
  ssr: false
})

export default function ClientPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">3D Baskı Hesaplama</h1>
          <p className="text-blue-400">STL dosyanızı yükleyin ve hemen fiyat alın</p>
        </div>
        
        {/* Main Content */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-4xl mx-auto border border-gray-700">
          <StlUploader />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400">
          <p>Profesyonel 3D Baskı Hizmetleri</p>
        </div>
      </div>
    </div>
  )
} 