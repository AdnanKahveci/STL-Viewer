interface BufferGeometry {
  attributes: {
    position: {
      array: Float32Array | number[];
      count: number;
    };
  };
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  } | null;
  computeBoundingBox(): void;
  scale(x: number, y: number, z: number): void;
  center(): void;
}

export interface PrintSettings {
  material: string;
  quality: string;
  quantity: number;
  color: string;
}

export interface PriceBreakdown {
  materialCost: number;
  laborCost: number;
  totalPrice: number;
  estimatedTime: number;
  weight: number;      // gram cinsinden
  volume: number;      // cm³ cinsinden
  infillPercentage: number;
}

class PriceCalculator {
  // Malzeme fiyatları (TL/gram)
  private materialPrices: { [key: string]: number } = {
    'PLA': 1.2,    // Gerçek PLA fiyatı
    'ABS': 1.5,    // Gerçek ABS fiyatı
    'PETG': 1.8,   // Gerçek PETG fiyatı
  };

  // Kalite ayarları
  private qualitySettings: { [key: string]: { layerHeight: number; multiplier: number; printSpeed: number } } = {
    'draft': {
      layerHeight: 0.3,    // mm
      multiplier: 1,
      printSpeed: 60       // mm/s
    },
    'standard': {
      layerHeight: 0.2,    // mm
      multiplier: 1.3,
      printSpeed: 45       // mm/s
    },
    'high': {
      layerHeight: 0.1,    // mm
      multiplier: 1.8,
      printSpeed: 30       // mm/s
    }
  };

  // Sabit değerler
  private readonly INFILL_PERCENTAGE = 20;  // % doluluk oranı
  private readonly SHELL_THICKNESS = 1.2;   // mm duvar kalınlığı
  private readonly BASE_LABOR_COST = 150;   // TL/saat işçilik maliyeti
  private readonly ELECTRICITY_COST = 15;   // TL/saat elektrik maliyeti
  private readonly MAINTENANCE_COST = 20;   // TL/saat bakım maliyeti

  private getMaterialDensity(material: string): number {
    // Malzeme yoğunlukları (g/cm³)
    const densities: { [key: string]: number } = {
      'PLA': 1.24,
      'ABS': 1.04,
      'PETG': 1.27
    };
    return densities[material] || 1.24;
  }

  calculateVolume(geometry: BufferGeometry): number {
    try {
      let volume = 0;
      if (!geometry?.attributes?.position?.array) {
        throw new Error('Geçersiz geometri verisi');
      }

      const positions = geometry.attributes.position.array;
      
      // Ölçeklendirme faktörü (mm'den cm³'e çevirme)
      const scale = 0.001; // 1000 mm³ = 1 cm³

      // Geometri verilerini kontrol et
      console.log('Geometri verileri:', {
        vertexCount: positions.length / 3,
        triangleCount: positions.length / 9,
        boundingBox: geometry.boundingBox,
      });

      // Her üçgen için hacim hesapla
      for (let i = 0; i < positions.length; i += 9) {
        const triangle = [
          {
            x: positions[i] * scale,
            y: positions[i + 1] * scale,
            z: positions[i + 2] * scale
          },
          {
            x: positions[i + 3] * scale,
            y: positions[i + 4] * scale,
            z: positions[i + 5] * scale
          },
          {
            x: positions[i + 6] * scale,
            y: positions[i + 7] * scale,
            z: positions[i + 8] * scale
          }
        ];

        const triangleVolume = this.calculateSignedVolumeOfTriangle(triangle);
        volume += triangleVolume;

        // Her 1000 üçgende bir log
        if (i % 9000 === 0) {
          console.log(`İşlenen üçgen: ${i/9}, Ara hacim: ${Math.abs(volume)} cm³`);
        }
      }

      const absoluteVolume = Math.abs(volume);
      
      // Sonuçları detaylı logla
      console.log('Hacim hesaplama sonuçları:', {
        rawVolume: volume,
        absoluteVolume,
        scale,
        triangleCount: positions.length / 9
      });

      if (absoluteVolume === 0 || isNaN(absoluteVolume)) {
        throw new Error('Geçersiz hacim hesaplandı');
      }

      return absoluteVolume;
    } catch (error) {
      console.error('Hacim hesaplama hatası:', error);
      throw error;
    }
  }

  calculatePrice(volume: number, settings: PrintSettings): PriceBreakdown {
    try {
      // Doluluk oranına göre gerçek hacim hesaplama
      const shellVolume = this.calculateShellVolume(volume);
      const infillVolume = (volume - shellVolume) * (this.INFILL_PERCENTAGE / 100);
      const totalVolume = shellVolume + infillVolume;

      // Ağırlık hesaplama (farklı malzemeler için farklı yoğunluklar)
      const density = this.getMaterialDensity(settings.material);
      const weight = totalVolume * density;

      // Malzeme maliyeti
      const materialCost = weight * this.materialPrices[settings.material];

      // Baskı süresi hesaplama
      const quality = this.qualitySettings[settings.quality];
      const layerCount = this.calculateLayerCount(volume, quality.layerHeight);
      const printTime = this.calculatePrintTime(layerCount, quality.printSpeed, volume);

      // İşçilik maliyeti
      const hourlyOperationCost = this.BASE_LABOR_COST + 
                                this.ELECTRICITY_COST + 
                                this.MAINTENANCE_COST;
      const laborCost = (printTime / 60) * hourlyOperationCost * quality.multiplier;

      // Toplam maliyet
      const basePrice = materialCost + laborCost;
      const totalPrice = basePrice * settings.quantity;

      return {
        materialCost,
        laborCost,
        totalPrice,
        estimatedTime: printTime / 60, // Saat cinsinden
        weight,
        volume: totalVolume,
        infillPercentage: this.INFILL_PERCENTAGE
      };
    } catch (error) {
      console.error('Fiyat hesaplama hatası:', error);
      throw error;
    }
  }

  private calculateShellVolume(totalVolume: number): number {
    // Kabaca dış kabuk hacmi hesaplama
    const approximateSize = Math.pow(totalVolume, 1/3);
    const shellVolume = (
      6 * Math.pow(approximateSize, 2) * this.SHELL_THICKNESS / 10
    );
    return Math.min(shellVolume, totalVolume);
  }

  private calculateLayerCount(volume: number, layerHeight: number): number {
    // Yaklaşık yükseklik hesaplama
    const approximateHeight = Math.pow(volume, 1/3);
    return Math.ceil(approximateHeight / layerHeight);
  }

  private calculatePrintTime(layerCount: number, printSpeed: number, volume: number): number {
    // Temel baskı süresi (dakika)
    const baseTime = (volume * 60) / printSpeed;
    
    // Katman değişimi için ek süre
    const layerChangeTime = layerCount * 2;
    
    // Toplam süre
    return baseTime + layerChangeTime;
  }

  private calculateSignedVolumeOfTriangle(triangle: Array<{x: number; y: number; z: number}>): number {
    try {
      const v1 = triangle[0];
      const v2 = triangle[1];
      const v3 = triangle[2];

      // Üçgen hacmini hesapla (signed volume formula)
      const volume = (
        v1.x * (v2.y * v3.z - v2.z * v3.y) +
        v1.y * (v2.z * v3.x - v2.x * v3.z) +
        v1.z * (v2.x * v3.y - v2.y * v3.x)
      ) / 6.0;

      if (isNaN(volume)) {
        console.error('Geçersiz üçgen hacmi:', { triangle, volume });
        return 0;
      }

      return volume;
    } catch (error) {
      console.error('Üçgen hacmi hesaplama hatası:', error);
      return 0;
    }
  }
}

export default new PriceCalculator(); 