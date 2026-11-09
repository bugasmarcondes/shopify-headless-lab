import Head from "next/head";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function Home() {
  return (
    <>
      <Head>
        <title>Shopify Headless Lab</title>
      </Head>
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          App is running
        </Typography>
        <Button variant="contained">MUI is working</Button>
      </Container>
    </>
  );
}
