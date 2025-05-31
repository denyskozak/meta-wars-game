"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  useCurrentAccount,
  useCurrentWallet,
  useSuiClientQuery,
} from "@mysten/dapp-kit";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  GithubIcon,
  DiscordIcon,
  SearchIcon,
  CoinIcon,
} from "@/components/icons";
import { convertMistToSui } from "@/utiltiies";
import { ConnectionButton } from "@/components/connection-button";

let clickedOnBalance = 0;

export const Navbar = () => {
  const [visibleCreateChampionship, setVisibleCreateChampionship] =
    useState(false);

  const account = useCurrentAccount();
  const { currentWallet, connectionStatus } = useCurrentWallet();


  const router = useRouter();

  const { data, refetch } = useSuiClientQuery(
    "getBalance",
    { owner: account?.address || "" },
    {
      gcTime: 10000,
    },
  );

  useEffect(() => {
    const intervalId = setInterval(() => refetch(), 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <Image alt="Logo" height={32} src="/logo_big.png" width={32} />
            <p className="font-bold text-inherit">Meta Wars</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          {/*<Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>*/}
          {/*    <TwitterIcon className="text-default-500"/>*/}
          {/*</Link>*/}
          <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Github" href={siteConfig.links.github}>
            <GithubIcon className="text-default-500" />
          </Link>
          {/*<ThemeSwitch />*/}
        </NavbarItem>
        {/*<NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>*/}
        <NavbarItem className="hidden md:flex gap-4">
          {account ? (
            <>
              {visibleCreateChampionship && (
                <Button
                  className="text-sm font-normal text-default-600 bg-default-100"
                  variant="flat"
                  onPress={() => {
                    router.push("/championships/create");
                  }}
                >
                  New Championship
                </Button>
              )}
              {account && (
                <Button
                  className="text-sm font-normal text-default-600 bg-default-100"
                  variant="flat"
                  onPress={() => {
                    if (clickedOnBalance > 10) {
                      setVisibleCreateChampionship(true);

                      return;
                    }
                    clickedOnBalance++;
                  }}
                >
                  Balance:
                  <CoinIcon className="text-danger" />
                  {` ${convertMistToSui(data?.totalBalance ? Number(data?.totalBalance) : 0)}`}
                </Button>
              )}
            </>
          ) : null}
          {/*<Button*/}
          {/*  className="text-sm font-normal text-default-600 bg-default-100"*/}
          {/*  variant="flat"*/}
          {/*  onPress={() => router.push("/login")}*/}
          {/*>*/}
          {/*  {address ? "Profile" : "Sign in"}*/}
          {/*</Button>*/}
          <ConnectionButton />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={
                  index === 2
                    ? "primary"
                    : index === siteConfig.navMenuItems.length - 1
                      ? "danger"
                      : "foreground"
                }
                href="#"
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
