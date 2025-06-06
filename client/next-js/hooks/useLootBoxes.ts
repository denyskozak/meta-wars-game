import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@/consts";

export const useLootBoxes = () => {
  const account = useCurrentAccount();

  const { data, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: `${PACKAGE_ID}::lootbox::LootBox` },
    },
    {
      gcTime: 10000,
    },
  );

  const lootboxes = Array.isArray(data?.data) ? data?.data : [];

  return { lootboxes, refetch };
};
