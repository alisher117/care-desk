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
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    // The one law of the module: core and web never reach into the host app.
    files: ["src/care-desk/core/**", "src/care-desk/web/**", "src/care-desk/config/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "!@/care-desk", "!@/care-desk/**"],
              message: "Care Desk core/web/config must not import from the host app.",
            },
            {
              group: ["**/host/**", "@/care-desk/host/**"],
              message: "Only routes and pages may import the host layer.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
