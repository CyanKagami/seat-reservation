import sharp from 'sharp';

export async function convertToWebp(inputBuffer: Buffer, quality = 80): Promise<Buffer> {
  return await sharp(inputBuffer)
    .webp({ quality })
    .toBuffer();
}

interface ParsedDataUrl {
  mimeType: string;
  buffer: Buffer;
}

export function isValidDataUrl(str:string) {
    const matches = str.match(/^data:(.+?);base64,(.+)$/);
    return !!matches;
}

export function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const matches = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  
  if (!matches) {
    throw new Error('Invalid Data URL format');
  }

  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], 'base64')
  };
}