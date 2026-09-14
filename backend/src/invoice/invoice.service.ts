import { Injectable, BadRequestException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class InvoiceService {
  async analyze(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new BadRequestException('ANTHROPIC_API_KEY no configurada en el servidor');

    // 1. Upload image to Supabase Storage (optional — works without it)
    let imageUrl = '';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const ext = (file.originalname.split('.').pop() ?? 'jpg').toLowerCase();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: uploadData, error } = await supabase.storage
          .from('facturas')
          .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });
        if (!error && uploadData) {
          const { data: urlData } = supabase.storage.from('facturas').getPublicUrl(uploadData.path);
          imageUrl = urlData.publicUrl;
        }
      } catch {
        // Storage upload failed — continue without image URL
      }
    }

    // 2. Analyze with Claude Vision
    const anthropic = new Anthropic({ apiKey });
    const base64 = file.buffer.toString('base64');
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const mediaType = (supportedTypes.includes(file.mimetype) ? file.mimetype : 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp'
      | 'image/gif';

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Analiza este documento (factura, recibo o ticket de compra) y extrae la información.
Responde SOLO con un JSON válido, sin texto adicional antes ni después:
{
  "supplier": "nombre del proveedor o tienda, o null si no se ve",
  "date": "fecha en formato YYYY-MM-DD, o null si no se ve",
  "notes": "observaciones relevantes, o null",
  "items": [
    {
      "name": "nombre del producto o insumo",
      "quantity": número,
      "unit": "kg/litros/unidades/porciones/bolsas/etc",
      "unitPrice": precio unitario en pesos colombianos como número entero,
      "total": subtotal del ítem como número entero
    }
  ],
  "total": total general de la factura como número entero
}
Si un campo no es legible, usa null. Los precios deben ser números sin puntos ni comas.`,
            },
          ],
        },
      ],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    let extractedData: any = {};
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) extractedData = JSON.parse(match[0]);
    } catch {
      // Return empty data if JSON parsing fails
    }

    return { imageUrl, data: extractedData };
  }
}
