export function normalizePdfText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function splitPdfTextIntoChunks(text: string, chunkSize = 2400): string[] {
  const normalized = normalizePdfText(text);
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= chunkSize) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (paragraph.length <= chunkSize) {
      current = paragraph;
      continue;
    }

    for (let i = 0; i < paragraph.length; i += chunkSize) {
      const piece = paragraph.slice(i, i + chunkSize).trim();
      if (piece) chunks.push(piece);
    }
    current = "";
  }

  if (current) chunks.push(current);
  return chunks;
}
