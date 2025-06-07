export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "MetaWars",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    // {
    //   label: "Home",
    //   href: "/",
    // },
    {
      label: "FAQ",
      href: "/faq",
    },

    {
      label: "Rules",
      href: "/rules",
    },
    // {
    //   label: "Pricing",
    //   href: "/pricing",
    // },
    // {
    //   label: "Blog",
    //   href: "/blog",
    // },
    // {
    //   label: "About",
    //   href: "/about",
    // },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    discord: "https://discord.gg/VumjGgsveB",
    github: "https://github.com/denyskozak/meta-champios",
    // twitter: "https://twitter.com/hero_ui",
    // docs: "https://heroui.com",
    // sponsor: "https://patreon.com/jrgarciadev",
  },
};
