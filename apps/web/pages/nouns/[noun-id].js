import React from "react";
import { ServiceCtxProvider } from "../../services/ServiceContext";
import { getStaticAuctionProps, getStaticAuctionPaths } from "../../services/static";
import { Page } from "../../components/Page";
import { AuctionPage } from "../../components/AuctionPage";

const ViewNouns = ({  address, config, ...props }) => {
  return (
    <Page>
      <ServiceCtxProvider key={address} address={address} config={config}>
        <AuctionPage {...props} />
      </ServiceCtxProvider>
    </Page>
  );
};

export const getStaticProps = getStaticAuctionProps;
export const getStaticPaths = getStaticAuctionPaths;

export default ViewNouns;
