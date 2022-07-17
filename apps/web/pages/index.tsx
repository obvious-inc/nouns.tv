import type { NextPage } from "next";
import React from "react";
import { ServiceCtxProvider } from "../services/ServiceContext";
import { useRouter } from "next/router";
import { getStaticAuctionProps, StaticProps } from "../services/static";
import { Page } from "../components/Page";
import { AuctionRow as AuctionPage } from "../components/AuctionRow";
import { FallbackPage } from "../templates/FallbackPage";

const ViewNouns: NextPage<StaticProps> = ({ auction, address, config }) => {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <FallbackPage />;
  }

  return (
    <Page>
      <ServiceCtxProvider key={address} address={address} config={config}>
        <AuctionPage auction={auction} />
      </ServiceCtxProvider>
    </Page>
  );
};

export const getStaticProps = getStaticAuctionProps;

export default ViewNouns;
