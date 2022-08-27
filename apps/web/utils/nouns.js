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

export const getSeedStats = (nouns, nounId) => {
  const noun = nouns.find((n) => Number(n.id) === Number(nounId));

  if (noun == null) throw new Error(`Noun not found: "${nounId}"`);

  const partNames = ["head", "body", "glasses", "accessory"];

  const partCounts = nouns.reduce((acc, n) => {
    for (let partName of partNames) {
      const partId = n.seed[partName];
      const partCount = acc[partName]?.[partId] ?? 0;
      acc[partName] = {
        ...acc[partName],
        [partId]: partCount + 1,
      };
    }

    return acc;
  }, {});

  return Object.fromEntries(
    partNames.map((partName) => {
      const id = noun.seed[partName];
      const count = partCounts[partName]?.[id] ?? 0;
      const total = nouns.length;
      return [partName, { id, count, total }];
    })
  );
};
