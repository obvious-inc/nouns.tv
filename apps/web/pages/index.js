// import type { NextPage } from "next";
import React from "react";
import { ServiceCtxProvider } from "../services/ServiceContext";
// import { useRouter } from "next/router";
import { getStaticAuctionProps } from "../services/static";
import { Page } from "../components/Page";
import { AuctionPage } from "../components/AuctionPage";
// import { FallbackPage } from "../templates/FallbackPage";

const ViewNouns = ({ nouns, address, config }) => {
  // const { isFallback } = useRouter();

  // if (isFallback) {
  //   return <FallbackPage />;
  // }

  return (
    <Page>
      <ServiceCtxProvider key={address} address={address} config={config}>
        <AuctionPage nouns={nouns} />
      </ServiceCtxProvider>
    </Page>
  );
};

export const getStaticProps = getStaticAuctionProps;

export default ViewNouns;
