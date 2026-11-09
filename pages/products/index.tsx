import type { GetStaticProps } from "next";
import Head from "next/head";
import NextLink from "next/link";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { getProducts, type ProductSummary } from "@/lib/products";

type Props = {
  products: ProductSummary[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const products = await getProducts();
  return { props: { products } };
};

export default function ProductsPage({ products }: Props) {
  return (
    <>
      <Head>
        <title>Products</title>
      </Head>
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Products
        </Typography>
        <List>
          {products.map((product) => (
            <ListItemButton
              key={product.handle}
              component={NextLink}
              href={`/products/${product.handle}`}
            >
              <ListItemText primary={product.title} />
            </ListItemButton>
          ))}
        </List>
      </Container>
    </>
  );
}
