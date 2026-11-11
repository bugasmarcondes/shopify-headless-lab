import { graphql } from "@/gql";
import type { ProductQuery, ProductsQuery } from "@/gql/graphql";
import { storefrontFetch } from "@/lib/shopify";
import { formatPrice } from "@/lib/format";

// Generated from the schema + the queries below by `pnpm codegen`.
export type ProductSummary = ProductsQuery["products"]["nodes"][number];
export type Product = NonNullable<ProductQuery["product"]>;
export type Money = Product["variants"]["nodes"][number]["price"];

// Only what the product page renders. This is what ends up in __NEXT_DATA__.
export type ProductViewModel = {
  title: string;
  description: string;
  image: { url: string; alt: string; width: number; height: number } | null;
  price: string | null;
};

const PRODUCTS_QUERY = graphql(`
  query Products {
    products(first: 20) {
      nodes {
        handle
        title
      }
    }
  }
`);

const PRODUCT_QUERY = graphql(`
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
`);

export async function getProducts(): Promise<ProductSummary[]> {
  const data = await storefrontFetch<ProductsQuery>(PRODUCTS_QUERY.toString());
  return data.products.nodes;
}

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await storefrontFetch<ProductQuery>(PRODUCT_QUERY.toString(), {
    handle,
  });
  return data.product;
}

export function toProductViewModel(product: Product): ProductViewModel {
  const image = product.images.nodes[0];
  const variant = product.variants.nodes[0];
  return {
    title: product.title,
    description: product.description,
    // Shopify can return null dimensions, and next/image needs both.
    image:
      image?.width && image.height
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
