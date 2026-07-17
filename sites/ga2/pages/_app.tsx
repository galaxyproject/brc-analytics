import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import type { AppProps } from "next/app";
import { JSX } from "react";

// Transitional scaffold entry. The full provider/layout stack from the root
// pages/_app.tsx is migrated in a later Phase C increment.
export default function App(props: AppProps): JSX.Element {
  const { Component, pageProps } = props;
  return (
    <AppCacheProvider {...props}>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
