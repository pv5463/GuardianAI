import Tesseract from 'tesseract.js';

export interface OCRResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        }
      }
    );

    if (!result.data.text || result.data.text.trim().length === 0) {
      return {
        success: false,
        error: 'No text detected in image. Please ensure the image contains readable text.'
      };
    }

    return {
      success: true,
      text: result.data.text.trim(),
      confidence: result.data.confidence
    };
  } catch (error: any) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: 'Failed to extract text from image. Please try again.'
    };
  }
}

export async function extractTextFromImageUrl(
  imageUrl: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        }
      }
    );

    if (!result.data.text || result.data.text.trim().length === 0) {
      return {
        success: false,
        error: 'No text detected in image.'
      };
    }

    return {
      success: true,
      text: result.data.text.trim(),
      confidence: result.data.confidence
    };
  } catch (error: any) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: 'Failed to extract text from image.'
    };
  }
}

export function preprocessImageForOCR(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = avg > 128 ? 255 : 0;
          data[i] = threshold;
          data[i + 1] = threshold;
          data[i + 2] = threshold;
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { type: file.type });
            resolve(processedFile);
          } else {
            reject(new Error('Failed to process image'));
          }
        }, file.type);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
