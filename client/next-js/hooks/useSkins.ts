import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@/consts";

export const useSkins = () => {
  const account = useCurrentAccount();

  const { data, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: `${PACKAGE_ID}::lootbox::Skin` },
      options: { showContent: true },
    },
    {
      gcTime: 10000,
    },
  );

  const skins = Array.isArray(data?.data) ? data?.data : [];

  return { skins, refetch };
};
