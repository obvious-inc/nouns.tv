import type { NextPage } from "next";
import React, { useEffect } from "react";
import { ServiceCtxProvider } from "../services/ServiceContext";
import { useRouter } from "next/router";
import { getStaticAuctionProps, StaticProps } from "../services/static";
import { Page } from "../components/Page";
import { AuctionRow as AuctionPage } from "../components/AuctionRow";
import { FallbackPage } from "../templates/FallbackPage";

const ViewNouns: NextPage<StaticProps> = ({ auction, address, config }) => {
  const { isFallback } = useRouter();

  useEffect(() => {
    let currSessionId;
    try {
      currSessionId = localStorage.getItem("sessionId");
    } catch (error) {
      console.error("Problems fetching data from local storage", error);
      return;
    }

    if (!currSessionId) {
      currSessionId = crypto.getRandomValues(new Uint32Array(1))[0].toString();
      localStorage.setItem("sessionId", currSessionId);
    }

    fetch("/api/audience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: currSessionId }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Something went wrong");
      }
    });

    window.addEventListener("beforeunload", function (event) {
      event.preventDefault();
      let sessionId;
      try {
        sessionId = localStorage.getItem("sessionId");
      } catch (error) {
        return;
      }
      fetch("/api/audience", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId }),
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Something went wrong");
        }
      });
    });
  }, []);

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
