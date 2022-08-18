import { ImageData } from "@nouns/assets";
import { buildSVG } from "@nouns/sdk";

export const getImageUrlFromSeed = ({ parts, background }) => {
  try {
    const svgBinary = buildSVG(parts, ImageData.palette, background);
    return `data:image/svg+xml;base64,${btoa(svgBinary)}`;
  } catch (e) {
    console.error(e);
    return null;
  }
};
