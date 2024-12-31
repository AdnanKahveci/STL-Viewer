'use client'

import React, { useState, useEffect } from 'react';
import PriceCalculator, { PrintSettings, PriceBreakdown } from '@/services/PriceCalculator';

interface OrderFormProps {
  modelDetails: File | null;
  geometry?: any;
  onSubmit: (data: any) => void;
}

export default function OrderForm({ modelDetails, geometry, onSubmit }: OrderFormProps) {
  const [orderData, setOrderData] = useState<PrintSettings>({
    material: 'PLA',
    quality: 'standard',
    quantity: 1,
    color: 'white'
  });

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form değiştiğinde fiyat hesaplamasını sıfırla
  useEffect(() => {
    setPriceBreakdown(null);
  }, [orderData]);

  const calculatePrice = () => {
    if (!geometry) {
      setError('Lütfen önce bir STL dosyası yükleyin');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const volume = PriceCalculator.calculateVolume(geometry);
      console.log('Hesaplanan hacim:', volume);
      
      if (volume > 0) {
        const breakdown = PriceCalculator.calculatePrice(volume, orderData);
        console.log('Fiyat detayları:', breakdown);
        setPriceBreakdown(breakdown);
        setError(null);
      } else {
        setError('Geçerli bir hacim hesaplanamadı. Lütfen STL dosyasını kontrol edin.');
      }
    } catch (error) {
      console.error('Fiyat hesaplama hatası:', error);
      setError('Fiyat hesaplanırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-6">Baskı Detayları</h2>
      
      {/* Model Bilgisi */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <p className="text-gray-300">
          {modelDetails ? (
            <>
              <span className="font-medium">Seçili Model: </span>
              {modelDetails.name}
            </>
          ) : (
            'Lütfen bir STL dosyası yükleyin'
          )}
        </p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Malzeme Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Malzeme
            <span className="text-gray-400 text-xs ml-2">(Fiyatlar gram başına)</span>
          </label>
          <select 
            value={orderData.material} 
            onChange={(e) => setOrderData({...orderData, material: e.target.value})}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="PLA">PLA (0.5 TL/g)</option>
            <option value="ABS">ABS (0.6 TL/g)</option>
            <option value="PETG">PETG (0.7 TL/g)</option>
          </select>
        </div>

        {/* Kalite Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Baskı Kalitesi
            <span className="text-gray-400 text-xs ml-2">(Katman yüksekliği)</span>
          </label>
          <select 
            value={orderData.quality}
            onChange={(e) => setOrderData({...orderData, quality: e.target.value})}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="draft">Taslak Kalite (0.3mm)</option>
            <option value="standard">Standart Kalite (0.2mm)</option>
            <option value="high">Yüksek Kalite (0.1mm)</option>
          </select>
        </div>

        {/* Renk Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Renk</label>
          <select 
            value={orderData.color}
            onChange={(e) => setOrderData({...orderData, color: e.target.value})}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="white">Beyaz</option>
            <option value="black">Siyah</option>
            <option value="blue">Mavi</option>
            <option value="red">Kırmızı</option>
          </select>
        </div>

        {/* Adet */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Adet</label>
          <input 
            type="number" 
            min="1"
            value={orderData.quantity}
            onChange={(e) => setOrderData({...orderData, quantity: parseInt(e.target.value) || 1})}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Fiyat Hesaplama Butonu */}
        <button 
          type="button"
          onClick={calculatePrice}
          disabled={!geometry || isCalculating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? 'Hesaplanıyor...' : 'Fiyat Hesapla'}
        </button>

        {/* Hata Mesajı */}
        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-500/10 rounded-lg">
            {error}
          </div>
        )}

        {/* Fiyat Detayları */}
        {priceBreakdown && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">Fiyat Detayları</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex justify-between">
                <span>Model Hacmi:</span>
                <span>{priceBreakdown.volume.toFixed(2)} cm³</span>
              </div>
              <div className="flex justify-between">
                <span>Tahmini Ağırlık:</span>
                <span>{priceBreakdown.weight.toFixed(2)} g</span>
              </div>
              <div className="flex justify-between">
                <span>İç Doluluk Oranı:</span>
                <span>%{priceBreakdown.infillPercentage}</span>
              </div>
              <div className="h-px bg-gray-700 my-2" />
              <div className="flex justify-between">
                <span>Malzeme Maliyeti:</span>
                <span>{priceBreakdown.materialCost.toFixed(2)} TL</span>
              </div>
              <div className="flex justify-between">
                <span>İşçilik + İşletme:</span>
                <span>{priceBreakdown.laborCost.toFixed(2)} TL</span>
              </div>
              <div className="flex justify-between">
                <span>Tahmini Süre:</span>
                <span>{priceBreakdown.estimatedTime.toFixed(1)} saat</span>
              </div>
              <div className="h-px bg-gray-700 my-2" />
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Toplam:</span>
                <span>{priceBreakdown.totalPrice.toFixed(2)} TL</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                * Fiyatlara KDV dahildir
              </p>
            </div>
          </div>
        )}

        {/* Sepete Ekle Butonu */}
        {priceBreakdown && (
          <button 
            type="button"
            onClick={() => onSubmit({ ...orderData, priceBreakdown })}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 mt-4"
          >
            Sepete Ekle
          </button>
        )}
      </form>
    </div>
  );
} 