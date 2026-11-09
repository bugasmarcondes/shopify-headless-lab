import { storefrontFetch } from "@/lib/shopify";
import { formatPrice } from "@/lib/format";

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
    nodes: { price: Money }[];
  };
};

// Only what the product page renders. This is what ends up in __NEXT_DATA__.
export type ProductViewModel = {
  title: string;
  description: string;
  image: { url: string; alt: string; width: number; height: number } | null;
  price: string | null;
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
      images(first: 1) {
        nodes {
          url
          altText
          width
          height
        }
      }
      variants(first: 1) {
        nodes {
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

export function toProductViewModel(product: Product): ProductViewModel {
  const image = product.images.nodes[0];
  const variant = product.variants.nodes[0];
  return {
    title: product.title,
    description: product.description,
    image: image
      ? {
          url: image.url,
          alt: image.altText ?? product.title,
          width: image.width,
          height: image.height,
        }
      : null,
    price: variant ? formatPrice(variant.price) : null,
  };
}
