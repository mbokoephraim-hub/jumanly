/**
 * Embeddings for the semantic criterion (partie 08), behind an interface. Voyage AI (multilingual)
 * when `EMBEDDINGS_PROVIDER=voyage` and its key and model are set; otherwise a local hashing
 * implementation: deterministic, free, good enough to compare shared words in local and preview.
 */
import { createHash } from "node:crypto";

export interface EmbeddingsProvider {
  readonly model: string;
  embed(texts: string[]): Promise<number[][]>;
}

const FAKE_DIMENSIONS = 256;

const words = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((word) => word.length >= 3);

export class HashingEmbeddings implements EmbeddingsProvider {
  readonly model = "hashing-256";

  async embed(texts: string[]) {
    return texts.map((text) => {
      const vector = new Array<number>(FAKE_DIMENSIONS).fill(0);
      for (const word of words(text)) {
        const hash = createHash("sha1").update(word).digest();
        vector[hash.readUInt16BE(0) % FAKE_DIMENSIONS]! += hash[2]! % 2 === 0 ? 1 : -1;
      }
      const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
      return vector.map((value) => value / norm);
    });
  }
}

export class VoyageEmbeddings implements EmbeddingsProvider {
  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async embed(texts: string[]) {
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ input: texts, model: this.model, input_type: "document" }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Embeddings: HTTP ${response.status}`);
    const body = (await response.json()) as { data: { embedding: number[]; index: number }[] };
    return [...body.data].sort((a, b) => a.index - b.index).map((item) => item.embedding);
  }
}

export function embeddingsProvider(): EmbeddingsProvider {
  const { EMBEDDINGS_PROVIDER, EMBEDDINGS_API_KEY, EMBEDDINGS_MODEL } = process.env;
  if (EMBEDDINGS_PROVIDER === "voyage" && EMBEDDINGS_API_KEY && EMBEDDINGS_MODEL) {
    return new VoyageEmbeddings(EMBEDDINGS_API_KEY, EMBEDDINGS_MODEL);
  }
  return new HashingEmbeddings();
}
