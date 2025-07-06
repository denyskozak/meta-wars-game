import { Fira_Code as FontMono } from "next/font/google";
import localFont from "next/font/local";

export const fontSans = localFont({
  src: "../public/fonts/Archivo-VariableFont_wdth.ttf",
  variable: "--font-sans",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});
