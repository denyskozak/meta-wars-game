import { useCurrentAccount, useSuiClientQuery, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { PACKAGE_ID, NETWORK } from "@/consts";
import { Transaction } from "@mysten/sui/transactions";

interface DaoProposal {
  id: string;
  description: string;
  yes: number;
  no: number;
}

export const useDao = () => {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const { data: proposalsData, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: PACKAGE_ID,
      filter: { StructType: `${PACKAGE_ID}::dao::Proposal` },
      options: { showContent: true },
    },
    { gcTime: 10000 },
  );

  const { data: tickets } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: `${PACKAGE_ID}::dao::DaoTicket` },
    },
    { gcTime: 10000 },
  );

  const hasTicket = Array.isArray(tickets?.data) && tickets.data.length > 0;
  const ticketId = hasTicket
    ? tickets.data[0].data?.objectId || tickets.data[0].reference?.objectId
    : undefined;

  const proposals: DaoProposal[] = Array.isArray(proposalsData?.data)
    ? proposalsData.data.map((p: any) => {
        const fields = p.data?.content?.fields || {};
        const descBytes = fields.description || [];
        const description = typeof descBytes === "string"
          ? descBytes
          : new TextDecoder().decode(Uint8Array.from(descBytes));
        return {
          id: p.data?.objectId || p.reference?.objectId || "",
          description,
          yes: Number(fields.yes || 0),
          no: Number(fields.no || 0),
        };
      })
    : [];

  const exec = async (tx: Transaction) => {
    const { bytes, signature } = await signTransaction({ transaction: tx, chain: `sui:${NETWORK}` });
    const result = await client.executeTransactionBlock({ transactionBlock: bytes, signature });
    await client.waitForTransaction({ digest: result.digest });
  };

  const vote = async (proposalId: string, inFavor: boolean) => {
    if (!ticketId || !account) return;
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::dao::vote`,
      arguments: [tx.object(proposalId), tx.object(ticketId), tx.pure.bool(inFavor)],
    });
    tx.setSender(account.address);
    await exec(tx);
    refetch();
  };

  return { proposals, hasTicket, vote };
};
