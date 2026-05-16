export type ToolSlug =
  | "diff-checker"
  | "epoch-converter"
  | "hmac-generator"
  | "json-formatter"
  | "jwt-decoder"
  | "lorem-ipsum-generator"
  | "regex-tester"
  | "secret-key-generator"
  | "uuid-generator"
  | "word-counter";

export type ToolMeta = {
  slug: ToolSlug;
  name: string;
  shortName: string;
  description: string;
  accent: string;
};

export const tools: ToolMeta[] = [
  {
    slug: "diff-checker",
    name: "Diff Checker",
    shortName: "Diff",
    description: "Compare two text blocks with line-level changes and counts.",
    accent: "#2563eb"
  },
  {
    slug: "epoch-converter",
    name: "Epoch Converter",
    shortName: "Epoch",
    description: "Convert Unix timestamps to readable local and UTC dates.",
    accent: "#0f766e"
  },
  {
    slug: "hmac-generator",
    name: "HMAC Generator",
    shortName: "HMAC",
    description: "Generate keyed hashes with SHA-1, SHA-256, SHA-384, or SHA-512.",
    accent: "#b45309"
  },
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    shortName: "JSON",
    description: "Beautify, minify, and validate JSON with 2 or 4 spaces.",
    accent: "#7c3aed"
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    shortName: "JWT",
    description: "Decode JWT headers and payloads locally without verification.",
    accent: "#be123c"
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    shortName: "Lorem",
    description: "Generate placeholder paragraphs, sentences, or words.",
    accent: "#15803d"
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    shortName: "Regex",
    description: "Test regular expressions, flags, matches, indexes, and groups.",
    accent: "#0891b2"
  },
  {
    slug: "secret-key-generator",
    name: "Secret Key Generator",
    shortName: "Secret",
    description: "Generate cryptographic random keys in hex or base64.",
    accent: "#c2410c"
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    shortName: "UUID",
    description: "Create one or many browser-generated UUID v4 values.",
    accent: "#4338ca"
  },
  {
    slug: "word-counter",
    name: "Word Counter",
    shortName: "Words",
    description: "Measure words, characters, lines, sentences, bytes, and time.",
    accent: "#64748b"
  }
];

export const toolBySlug = Object.fromEntries(
  tools.map((tool) => [tool.slug, tool])
) as Record<ToolSlug, ToolMeta>;
