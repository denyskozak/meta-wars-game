"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { WalletProvider } from "@mysten/dapp-kit";
import { createNetworkConfig, SuiClientProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Config options for the networks you want to connect to
import { ToastProvider } from "@heroui/toast";

import { NETWORK } from "@/consts";
import {InterfaceProvider} from "@/context/inteface";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl(NETWORK) },
});
const queryClient = new QueryClient();

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ToastProvider />
      <InterfaceProvider>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider defaultNetwork="testnet" networks={networkConfig}>
          <WalletProvider slushWallet={{
            name: "Meta Wars Tournaments",
          }}>
            <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
      </InterfaceProvider>
    </HeroUIProvider>
  );
}
