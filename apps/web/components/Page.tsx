import Head from "next/head";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../utils/seo";
import React from "react";

type PageProps = {
  title?: string;
  description?: string;
  image?: string;
  children: React.ReactNode;
};

const image = `${SITE_URL}/metatag.png`;

export function Page({
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
  children,
}: PageProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="2400" />
        <meta property="og:image:height" content="1256" />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:site" content={SITE_URL} />
        <meta name="twitter:image" content={image} />

        <link rel="icon" type="image/png" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </Head>
      {children}
    </>
  );
}
