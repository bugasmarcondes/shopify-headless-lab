import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getProduct, type Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";

type Props = {
  product: Product;
};

// Build no product pages at build time; each one is rendered on its
// first visit ("blocking" = wait for full HTML) and then cached.
export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props, { handle: string }> = async ({
  params,
}) => {
  const product = await getProduct(params!.handle);
  if (!product) {
    return { notFound: true };
  }
  // Deliberately the full Shopify response for now (Milestone 3 trims it).
  // One day on purpose: in Milestone 4 the webhook, not the timer, refreshes it.
  return { props: { product }, revalidate: 86400 };
};

export default function ProductPage({ product }: Props) {
  const image = product.images.nodes[0];
  const variant = product.variants.nodes[0];

  return (
    <>
      <Head>
        <title>{product.title}</title>
      </Head>
      <Container sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
          {image && (
            <Box sx={{ flex: 1 }}>
              <Image
                src={image.url}
                alt={image.altText ?? product.title}
                width={image.width}
                height={image.height}
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ width: "100%", height: "auto" }}
                priority
              />
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {product.title}
            </Typography>
            {variant && (
              <Typography variant="h5" color="primary" gutterBottom>
                {formatPrice(variant.price)}
              </Typography>
            )}
            <Typography variant="body1">{product.description}</Typography>
          </Box>
        </Stack>
      </Container>
    </>
  );
}
