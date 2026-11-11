import type { TypedDocumentString } from "@/gql/graphql";

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

// Server-side only: uses the private token. Import this from getStaticProps,
// getServerSideProps or API routes, never from components.
// The document carries its result and variables types, so callers get both
// inferred. Queries without variables take no second argument.
export async function storefrontFetch<TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  if (typeof window !== "undefined") {
    throw new Error("storefrontFetch is server-only");
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const version = process.env.SHOPIFY_STOREFRONT_API_VERSION;
  const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  if (!domain || !version || !token) {
    throw new Error("Missing Shopify environment variables");
  }

  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": token,
    },
    body: JSON.stringify({ query: document.toString(), variables }),
  });

  // Layer 1: HTTP. Read the body as text: error responses aren't always JSON.
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Shopify HTTP ${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
    );
  }

  // Layer 2: GraphQL reports many errors with HTTP 200, so check the body too.
  // Layer 3 (mutation userErrors) lives inside `data` and is checked by callers.
  const json = (await res.json()) as GraphQLResponse<TResult>;
  if (json.errors?.length) {
    throw new Error(
      `Shopify GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!json.data) {
    throw new Error("Shopify response has no data");
  }

  return json.data;
}
