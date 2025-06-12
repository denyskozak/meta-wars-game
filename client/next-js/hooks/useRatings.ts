export interface RatingItem {
  name: string;
  points: number;
}

export const useRatings = () => {
  const ratings: RatingItem[] = [
    { name: "NFT #1", points: 1500 },
    { name: "NFT #2", points: 1400 },
    { name: "NFT #3", points: 1300 },
    { name: "NFT #4", points: 1200 },
    { name: "NFT #5", points: 1100 },
    { name: "NFT #6", points: 1000 },
    { name: "NFT #7", points: 900 },
    { name: "NFT #8", points: 800 },
    { name: "NFT #9", points: 700 },
    { name: "NFT #10", points: 600 },
  ];

  return { ratings };
};
