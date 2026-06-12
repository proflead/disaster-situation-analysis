export function chunkText(text: string, maxChars = 1800) {
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > maxChars && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current) chunks.push(current);
  return chunks.length ? chunks : [text.slice(0, maxChars)];
}

export function localRetrieve<T extends { source: string; text: string }>(query: string, documents: T[], limit = 5) {
  const terms = new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3));
  return documents
    .map((document) => {
      const text = document.text.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score += 1;
      }
      return { ...document, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
