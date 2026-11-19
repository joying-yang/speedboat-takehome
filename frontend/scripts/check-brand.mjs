import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceRoot = join(projectRoot, "src");
const tokensPath = join(sourceRoot, "styles", "tokens.css");
const typographyPath = join(sourceRoot, "styles", "typography.css");
const errors = [];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(path) : [path];
    }),
  );
  return nested.flat();
}

function report(path, line, message) {
  errors.push(`${relative(projectRoot, path)}:${line} ${message}`);
}

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function extractVariables(source) {
  return Object.fromEntries(
    [...source.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/gi)].map((match) => [
      match[1],
      match[2].trim().toLowerCase(),
    ]),
  );
}

function luminance(hex) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const files = (await sourceFiles(sourceRoot)).filter((path) =>
  [".css", ".ts", ".tsx"].includes(extname(path)),
);

for (const path of files) {
  const source = await readFile(path, "utf8");
  const isTokenSource = path === tokensPath;
  const isTypographySource = path === typographyPath;

  if (!isTokenSource) {
    for (const match of source.matchAll(/#[0-9a-f]{3,8}\b|rgba?\(/gi)) {
      report(path, lineNumber(source, match.index), "raw colors must use a semantic token");
    }
  }

  if (extname(path) === ".css" && !isTokenSource && !isTypographySource) {
    for (const match of source.matchAll(/(?:font-size|font-family|line-height):\s*([^;]+);/gi)) {
      if (!match[1].trim().startsWith("var(")) {
        report(path, lineNumber(source, match.index), "typography values must use a role token");
      }
    }

    for (const match of source.matchAll(/(?:margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|row-gap|column-gap):\s*([^;]+);/gi)) {
      const value = match[1].trim();
      const rawDimensions = [...value.matchAll(/-?\d+(?:\.\d+)?(?:px|rem)/g)].map((item) => item[0]);
      const onlyAccessibilityOffset = rawDimensions.length === 1 && rawDimensions[0] === "-1px";
      if (rawDimensions.length > 0 && !onlyAccessibilityOffset) {
        report(path, lineNumber(source, match.index), "spacing must use the 4px token scale");
      }
    }

    for (const match of source.matchAll(/border-radius:\s*([^;]+);/gi)) {
      const value = match[1].trim();
      if (!value.startsWith("var(") && value !== "50%") {
        report(path, lineNumber(source, match.index), "radii must use a brand radius token");
      }
    }
  }
}

const tokensSource = await readFile(tokensPath, "utf8");
const darkStart = tokensSource.indexOf("@media (prefers-color-scheme: dark)");
const lightTokens = extractVariables(tokensSource.slice(0, darkStart));
const darkTokens = extractVariables(tokensSource.slice(darkStart));

const expectedLightPalette = {
  "--bg-canvas": "#fafaf9",
  "--bg-surface": "#ffffff",
  "--bg-subtle": "#f4f4f2",
  "--border-default": "#e5e5e1",
  "--border-strong": "#cfcfc8",
  "--text-primary": "#0f0f12",
  "--text-secondary": "#5c5c66",
  "--text-tertiary": "#8a8a93",
  "--accent-primary": "#1f5bff",
  "--accent-subtle": "#e6edff",
  "--state-success": "#0e8c58",
  "--state-warning": "#b25c00",
  "--state-danger": "#c0241c",
};

const expectedDarkPalette = {
  "--bg-canvas": "#0b0b0e",
  "--bg-surface": "#15161b",
  "--bg-subtle": "#1c1d24",
  "--border-default": "#2a2b33",
  "--border-strong": "#3c3d47",
  "--text-primary": "#f5f5f4",
  "--text-secondary": "#a8a8b0",
  "--text-tertiary": "#777780",
  "--accent-primary": "#5c84ff",
  "--accent-subtle": "#1b2542",
  "--state-success": "#2bb87a",
  "--state-warning": "#d88a2a",
  "--state-danger": "#e0584f",
};

for (const [theme, actual, expected] of [
  ["light", lightTokens, expectedLightPalette],
  ["dark", darkTokens, expectedDarkPalette],
]) {
  for (const [token, value] of Object.entries(expected)) {
    if (actual[token] !== value) {
      errors.push(`styles/tokens.css ${theme} ${token} must be ${value}; received ${actual[token] ?? "missing"}`);
    }
  }
}

const expectedSpacing = [4, 8, 12, 16, 20, 24, 32, 40, 56, 80];
for (const [index, value] of expectedSpacing.entries()) {
  const token = `--space-${[1, 2, 3, 4, 5, 6, 8, 10, 14, 20][index]}`;
  if (lightTokens[token] !== `${value}px`) {
    errors.push(`styles/tokens.css ${token} must be ${value}px`);
  }
}

const contrastPairs = [
  ["--text-primary", "--bg-canvas", 4.5],
  ["--text-primary", "--bg-surface", 4.5],
  ["--text-secondary", "--bg-canvas", 4.5],
  ["--text-secondary", "--bg-surface", 4.5],
  ["--accent-primary", "--bg-surface", 3],
  ["--bg-surface", "--accent-primary", 4.5],
  ["--bg-surface", "--state-danger", 4.5],
  ["--state-success", "--bg-surface", 3],
  ["--state-warning", "--bg-surface", 3],
];

for (const [theme, tokens] of [["light", lightTokens], ["dark", darkTokens]]) {
  for (const [foreground, background, minimum] of contrastPairs) {
    const ratio = contrast(tokens[foreground], tokens[background]);
    if (ratio < minimum) {
      errors.push(
        `styles/tokens.css ${theme} contrast ${foreground}/${background} is ${ratio.toFixed(2)}; minimum ${minimum}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`Brand check failed with ${errors.length} issue(s):\n\n${errors.join("\n")}`);
  process.exit(1);
}

console.log(`Brand check passed: ${files.length} source files, exact palette/spacing tokens, and ${contrastPairs.length * 2} contrast pairs.`);
