import { storefrontFetch } from "@/lib/shopify";

export type ProductSummary = {
  handle: string;
  title: string;
};

export type Money = {
  amount: string; // Shopify's Decimal comes as a string, e.g. "19.99"
  currencyCode: string;
};

export type Product = {
  title: string;
  description: string;
  images: {
    nodes: { url: string; altText: string | null; width: number; height: number }[];
  };
  variants: {
    nodes: { id: string; title: string; price: Money }[];
  };
};

const PRODUCTS_QUERY = `
  query Products {
    products(first: 20) {
      nodes {
        handle
        title
      }
    }
  }
`;

const PRODUCT_QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) {
      title
      description
      images(first: 5) {
        nodes {
          url
          altText
          width
          height
        }
      }
      variants(first: 10) {
        nodes {
          id
          title
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export async function getProducts(): Promise<ProductSummary[]> {
  const data = await storefrontFetch<{ products: { nodes: ProductSummary[] } }>(
    PRODUCTS_QUERY,
  );
  return data.products.nodes;
}

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await storefrontFetch<{ product: Product | null }>(
    PRODUCT_QUERY,
    { handle },
  );
  return data.product;
}
