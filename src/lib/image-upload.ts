import { supabase } from '@/lib/supabase/client';

/**
 * Comprime e redimensiona uma imagem no navegador para envio eficiente
 */
export async function compressImage(file: File, maxDimension = 1200, quality = 0.8): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context unavailable'));
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Falha ao processar imagem'));
            resolve({ dataUrl, blob });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Tenta upload no Supabase Storage; se o bucket não estiver pronto, usa DataURL comprimido como fallback 100% resiliente
 */
export async function uploadComprovante(file: File, prefix = 'print'): Promise<string> {
  try {
    const { dataUrl, blob } = await compressImage(file);
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

    // 1. Tentar upload no Supabase Storage
    const { data, error } = await supabase.storage
      .from('comprovantes')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (!error && data) {
      const { data: publicData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
    }

    // 2. Se o bucket não existir ainda no Supabase, retorna o dataUrl comprimido (garante que nada seja perdido)
    return dataUrl;
  } catch (err) {
    console.warn('Fallback para DataURL devido a:', err);
    const { dataUrl } = await compressImage(file);
    return dataUrl;
  }
}
