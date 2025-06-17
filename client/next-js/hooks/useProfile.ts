import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@/consts";

export const useProfile = () => {
  const account = useCurrentAccount();

  const { data, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: `${PACKAGE_ID}::profile::Profile` },
      options: { showContent: true },
    },
    { gcTime: 10000 },
  );

  const profileObj = Array.isArray(data?.data) && data.data.length > 0 ? data.data[0] : null;

  let nickname: string | null = null;
  if (profileObj) {
    const fields = (profileObj as any).data?.content?.fields || {};
    const nickBytes = fields.nickname || [];
    nickname = typeof nickBytes === "string" ? nickBytes : new TextDecoder().decode(Uint8Array.from(nickBytes));
  }

  return { profile: profileObj, nickname, refetch };
};
