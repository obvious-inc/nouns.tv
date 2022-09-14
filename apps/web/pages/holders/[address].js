import { GraphQLClient } from "graphql-request";
import Link from "next/link";
import React from "react";
import { css, keyframes } from "@emotion/react";
import { useEnsAvatar, useEnsName, useBalance } from "wagmi";
import { formatEther } from "ethers/lib/utils";
import {
  ServiceCtxProvider,
  configLookup,
} from "../../services/ServiceContext";
import { SubgraphService } from "../../services/subgraph.service";
import { STACKED_MODE_BREAKPOINT } from "../../constants/layout";
import { getImageUrlFromSeed as getNounImageUrlFromSeed } from "../../utils/nouns";
import { NOUN_TOKEN_ADDRESS, shortenAddress } from "../../utils/address";
import { Page } from "../../components/Page";
import ChatLayout from "../../components/ChatLayout";
import { Label, Heading2 } from "../../components/AuctionPage";

const warmBackground = "#e1d7d5";
const coldBackground = "#d5d7e1";

const backgroundAnimation = keyframes({
  "0%": {
    background: warmBackground,
  },
  "50%": {
    background: coldBackground,
  },
  "100%": {
    background: warmBackground,
  },
});

const Holder = ({ address, config, holder }) => {
  const [showAddress, setShowAddress] = React.useState(false);
  const { data: holderAvatarUrl } = useEnsAvatar({
    addressOrName: holder.address,
  });
  const { data: holderEnsName } = useEnsName({ address: holder.address });
  const { data: holderWalletBalance } = useBalance({
    addressOrName: holder.address,
  });
  const shortHolderAddress = shortenAddress(holder.address);

  return (
    <Page>
      <ServiceCtxProvider key={address} address={address} config={config}>
        <ChatLayout>
          <div
            css={css({
              background: "white",
              padding: "0.5rem 1.5rem",
              display: "flex",
              alignItems: "center",
              minHeight: "6rem",
            })}
          >
            {holderAvatarUrl && (
              <img
                src={holderAvatarUrl}
                css={css({
                  display: "block",
                  width: "4rem",
                  height: "4rem",
                  objectFit: "cover",
                  borderRadius: "50%",
                  marginRight: "1rem",
                })}
              />
            )}
            <button
              onClick={() => setShowAddress((s) => !s)}
              disabled={holderEnsName == null}
              css={css({
                background: "none",
                padding: 0,
                border: 0,
                cursor: "pointer",
                ":disabled": { cursor: "default" },
              })}
            >
              <h1
                css={css({ margin: 0, fontSize: "2.8rem", fontWeight: "900" })}
              >
                {showAddress
                  ? shortHolderAddress
                  : holderEnsName ?? shortHolderAddress}
              </h1>
            </button>
            <div css={css({ flex: 1 })} />
            <div css={css({ display: "flex", alignItems: "center" })}>
              {holderWalletBalance?.value != null && (
                <div>
                  <Label>Wallet balance</Label>
                  <Heading2>
                    {"Ξ "}
                    {parseFloat(formatEther(holderWalletBalance.value)).toFixed(
                      2
                    )}
                  </Heading2>
                </div>
              )}

              <a
                href={`https://etherscan.io/address/${holder.address}`}
                target="_blank"
                rel="noreferrer"
                css={css({
                  marginLeft: "2rem",
                  ":hover img": { transform: "scale(1.05)" },
                  img: { display: "block", width: "3.2rem" },
                })}
              >
                <img src="/etherscan-icon.png" />
              </a>
              <a
                href={`https://rainbow.me/${holder.address}`}
                target="_blank"
                rel="noreferrer"
                css={css({
                  marginLeft: "1rem",
                  ":hover img": { transform: "scale(1.05)" },
                  img: { display: "block", width: "3.2rem" },
                })}
              >
                <img src="/rainbow-icon.png" />
              </a>
            </div>
          </div>
          <div
            css={css({
              flex: 1,
              minHeight: 0,
              maxHeight: "calc(50vh - 16rem)",
              animation: `${backgroundAnimation} 6s linear infinite`,
              overflow: "auto",
              [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                maxHeight: "none",
              },
            })}
          >
            <ul
              css={css({
                margin: 0,
                padding: "1.5rem",
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0,1fr))",
                gridGap: "1.5rem",
                li: { listStyle: "none" },
                [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                  gridTemplateColumns: "repeat(6, minmax(0,1fr))",
                },
                a: {
                  display: "block",
                  ":hover .image-container": {
                    transform: "scale(1.025)",
                  },
                  ":hover .power-light": {
                    background: "#00c100",
                    boxShadow: "0 0 0 0.1rem #00ff08",
                  },
                },
                ".image-container": {
                  position: "relative",
                  width: "100%",
                  // boxShadow: "2px 2px 0 0 rgb(0 0 0 / 15%)",
                  // transition: "0.075s all ease-out",
                  border: "0.1rem solid black",
                  padding: "0.5rem",
                  paddingBottom: "1.5rem",
                  borderRadius: "0.5rem",
                  background: "hsl(0 0% 85%)",
                  boxShadow: "0px 3px 0 0 rgb(0 0 0 / 15%)",
                },
                ".title": {
                  textAlign: "center",
                  marginTop: "0.8rem",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                },
                img: {
                  display: "block",
                  width: "100%",
                  // boxShadow: "2px 2px 0 0 rgb(0 0 0 / 15%)",
                  // transition: "0.075s all ease-out",
                  border: "0.1rem solid rgb(0 0 0 / 50%)",
                  borderRadius: "2px",
                },
              })}
            >
              {holder.nouns
                .sort((n1, n2) => {
                  const [i1, i2] = [n1, n2].map((n) => Number(n.id));
                  if (i1 > i2) return 1;
                  if (i1 < i2) return -1;
                  return 0;
                })
                .map((n) => {
                  const imageUrl = getNounImageUrlFromSeed(n.seed);
                  return (
                    <li key={n.id}>
                      <Link href={`/nouns/${n.id}`}>
                        <a>
                          <div className="image-container">
                            <img src={imageUrl} />
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                bottom: "0.5rem",
                                width: "100%",
                                padding: "0 0.6rem",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: "0.1rem",
                                  height: "0.5rem",
                                  background: "black",
                                  marginRight: "1px",
                                }}
                              />
                              <div
                                style={{
                                  width: "0.1rem",
                                  height: "0.5rem",
                                  background: "black",
                                  marginRight: "1px",
                                }}
                              />
                              <div
                                style={{
                                  width: "0.1rem",
                                  height: "0.5rem",
                                  background: "black",
                                  marginRight: "1px",
                                }}
                              />
                              <div
                                style={{
                                  width: "0.1rem",
                                  height: "0.5rem",
                                  background: "black",
                                  marginRight: "1px",
                                }}
                              />
                              <div
                                style={{
                                  width: "0.1rem",
                                  height: "0.5rem",
                                  background: "black",
                                  marginRight: "1px",
                                }}
                              />
                              <div style={{ flex: 1 }} />
                              <div
                                className="power-light"
                                css={css({
                                  width: "0.3rem",
                                  height: "0.3rem",
                                  borderRadius: "50%",
                                  background: "rgb(0 0 0 / 10%)",
                                  boxShadow: "0 0 0 0.1rem rgb(0 0 0 / 45%)",
                                })}
                              />
                              <div
                                style={{
                                  width: "0.8rem",
                                  height: "0.5rem",
                                  background: "#4b4b4b",
                                  borderRadius: "0.2rem",
                                  marginLeft: "0.4rem",
                                }}
                              />
                            </div>
                          </div>
                          <div className="title">Noun {n.id}</div>
                        </a>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        </ChatLayout>
      </ServiceCtxProvider>
    </Page>
  );
};

const address = NOUN_TOKEN_ADDRESS;
const config_ = configLookup(address);

export const getStaticProps = async ({ params }) => {
  const client = new GraphQLClient(config_.baseURI);
  const service = new SubgraphService(address, client);
  const nouns = await service.getNouns();
  const holderNouns = nouns.filter(
    (n) => n.owner.address.toLowerCase() === params.address.toLowerCase()
  );

  return {
    props: {
      address,
      config: config_,
      holder: { address: params.address.toLowerCase(), nouns: holderNouns },
    },
    revalidate: 30,
  };
};

export const getStaticPaths = async () => {
  const client = new GraphQLClient(config_.baseURI);
  const service = new SubgraphService(address, client);
  const nouns = await service.getNouns();
  return {
    paths: nouns.map((n) => ({ params: { address: n.owner.address } })),
    fallback: "blocking", // can also be true or 'blocking'
  };
};

export default Holder;
