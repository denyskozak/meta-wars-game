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

  const mock = [
      {id: 'asda324234'},
      {id: 'wgw'},
      {id: 'wef32f32'},
  ]
  return { lootboxes: mock, refetch };
};
