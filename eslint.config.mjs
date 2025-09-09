import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Disable the rule that prevents using 'any' type
      // This allows explicit use of 'any' when needed for dynamic content or third-party integrations
      "@typescript-eslint/no-explicit-any": "off",

      // Disable the rule that enforces exhaustive dependencies in useEffect
      // This allows manual control over effect dependencies when you know what you're doing
      "react-hooks/exhaustive-deps": "off",

      // Disable the rule that flags unused variables
      // Useful when variables are kept for future use or debugging purposes
      "@typescript-eslint/no-unused-vars": "off",

      // Disable the rule that prevents empty object types/interfaces
      // Allows creating placeholder interfaces or extending base types
      "@typescript-eslint/no-empty-object-type": "off"
    }
  }
];

export default eslintConfig;