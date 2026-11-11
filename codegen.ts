import { existsSync } from "node:fs";
import type { CodegenConfig } from "@graphql-codegen/cli";

// Locally the token lives in .env.local; on Netlify it's already in process.env.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION;
const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
if (!domain || !version || !token) {
  throw new Error("Missing Shopify environment variables");
}

const config: CodegenConfig = {
  schema: [
    {
      [`https://${domain}/api/${version}/graphql.json`]: {
        headers: { "Shopify-Storefront-Private-Token": token },
      },
    },
  ],
  documents: ["lib/**/*.ts", "pages/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  generates: {
    "gql/": {
      preset: "client",
      presetConfig: { fragmentMasking: false },
      config: {
        // Queries become plain strings with types attached, so fetch can send them.
        documentMode: "string",
        // Shopify's custom scalars would otherwise be typed as `any`.
        scalars: {
          Color: "string",
          DateTime: "string",
          Decimal: "string",
          HTML: "string",
          ISO8601DateTime: "string",
          JSON: "unknown",
          URL: "string",
          UnsignedInt64: "string",
        },
        defaultScalarType: "unknown",
      },
    },
  },
};

export default config;
