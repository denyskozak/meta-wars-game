import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@/consts";

export const useItems = () => {
  const account = useCurrentAccount();

  const { data, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: `${PACKAGE_ID}::item::Item` },
      options: { showContent: true },
    },
    {
      gcTime: 10000,
    },
  );

  const items = Array.isArray(data?.data) ? data.data : [];

  return { items, refetch };
};
