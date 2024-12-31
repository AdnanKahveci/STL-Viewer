'use client'

import { useState } from 'react'
import StlViewer from './StlViewer'
import OrderForm from './OrderForm'
import * as THREE from 'three'

export default function StlUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError('');
      const file = event.target.files?.[0];
      
      if (!file) {
        setError('Lütfen bir dosya seçin');
        return;
      }

      // Dosya tipini kontrol et
      if (!file.name.toLowerCase().endsWith('.stl')) {
        setError('Lütfen sadece .stl uzantılı dosya yükleyin');
        return;
      }

      // Dosya boyutunu kontrol et (örn: 50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('Dosya boyutu 50MB\'dan küçük olmalıdır');
        return;
      }

      setSelectedFile(file);
    } catch (err) {
      console.error('Dosya yükleme hatası:', err);
      setError('Dosya yüklenirken bir hata oluştu');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const changeEvent = {
        target: {
          files: [file]
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileUpload(changeEvent);
    }
  };

  const handleGeometryLoad = (loadedGeometry: any) => {
    console.log('Geometry loaded in StlUploader:', loadedGeometry);
    setGeometry(loadedGeometry);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Sol Taraf - STL Yükleme ve Görüntüleme */}
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div 
            className="flex items-center justify-center w-full"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-500 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">STL dosyanızı yükleyin</span>
                </p>
                <p className="text-xs text-gray-400">veya sürükleyip bırakın</p>
                {error && (
                  <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
                {selectedFile && (
                  <p className="mt-2 text-sm text-green-500">
                    Seçilen dosya: {selectedFile.name}
                  </p>
                )}
              </div>
              <input 
                type="file" 
                accept=".stl"
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
        
        {selectedFile && (
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <StlViewer 
              file={URL.createObjectURL(selectedFile)} 
              onGeometryLoad={handleGeometryLoad}
            />
          </div>
        )}
      </div>

      {/* Sağ Taraf - Sipariş Formu */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 h-fit">
        <OrderForm 
          modelDetails={selectedFile}
          geometry={geometry}
          onSubmit={(data) => {
            setOrderDetails(data);
            console.log('Sipariş detayları:', data);
          }}
        />
      </div>
    </div>
  );
} 