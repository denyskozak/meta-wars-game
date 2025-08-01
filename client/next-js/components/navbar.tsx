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
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Image from "next/image";
import {
  useCurrentAccount,
  useCurrentWallet,
  useSuiClientQuery,
} from "@mysten/dapp-kit";

import { ButtonWithSound as Button } from "@/components/button-with-sound";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  DiscordIcon,
  SearchIcon,
  UnmuteIcon,
  MuteIcon,
} from "@/components/icons";
import { useBackgroundMusic } from "@/components/background-music";

let clickedOnBalance = 0;

export const Navbar = () => {
  const account = useCurrentAccount();
  const { currentWallet, connectionStatus } = useCurrentWallet();

  const { playing, toggle } = useBackgroundMusic();

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
    <HeroUINavbar height="98px" maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-4" href="/">
            <Image alt="Logo" height={48} src="/logo_big.png" width={48} />
            <p className="font-bold text-inherit text-center">
              Meta Wars
              <br />
              <span className="text-sm font-light">In Development</span>
            </p>
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
          {/*<Link isExternal aria-label="Github" href={siteConfig.links.github}>*/}
          {/*  <GithubIcon className="text-default-500" />*/}
          {/*</Link>*/}
          <button
            aria-label={playing ? "Mute music" : "Unmute music"}
            className="px-px transition-opacity hover:opacity-80 cursor-pointer"
            type="button"
            onClick={toggle}
          >
            {playing ? (
              <MuteIcon className="text-default-500" />
            ) : (
              <UnmuteIcon className="text-default-500" />
            )}
          </button>
          {/*<ThemeSwitch />*/}
        </NavbarItem>
        {/*<NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>*/}
        <NavbarItem className="hidden md:flex gap-4">
          {account ? (
            <>
              {account && (
                <Button
                  className="border-2 border-black shadow-lg overflow-hidden group "
                  size="lg"
                  onPress={() => router.push("/loot")}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-500 via-yellow-500 to-purple-500 animate-pulse opacity-100 group-hover:opacity-100 blur-md" />
                  <span className="relative z-10">Loot</span>
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
          <Button
            className="border-2 border-black shadow-lg overflow-hidden group"
            size="lg"
            onPress={() => router.push("/play")}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] via-[#38BDF8] to-[#FBBF24] animate-pulse opacity-100 group-hover:opacity-100 blur-md" />
            <span className="relative z-10">
              {account ? "Play" : "Launch Game"}
            </span>
          </Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
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
