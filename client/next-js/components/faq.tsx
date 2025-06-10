import { Accordion, AccordionItem } from "@heroui/react";

export function FAQ() {
  const questions = [
    [
      "What is Meta Wars Championship?",
      "Meta Wars Championship is a blockchain powered tournament platform where players battle in supported games and earn on‑chain rewards.",
    ],
    [
      "How do I join a tournament?",
      "Sign in with your Sui wallet and create or join a championship from the lobby. Matches start automatically once enough players gather.",
    ],
    [
      "How can I earn rewards?",
      "Victories grant loot boxes and $MetaWars tokens. The better you perform, the more loot and tokens you receive.",
    ],
    [
      "What can I do with $MetaWars?",
      "$MetaWars is our native token used for purchasing in‑game items, entering events and participating in DAO voting.",
    ],
    [
      "Can I convert SUI or $MetaWars to EUR or USD?",
      "Yes. Transfer your tokens to an exchange like Binance or Crypto.com and trade them for your preferred fiat currency.",
    ],
    [
      "Which game titles are supported?",
      "The platform can host any multiplayer game. We currently focus on League of Legends style arenas.",
    ],
  ];

  return (
    <Accordion>
      {questions.map(([question, answer], index) => (
        <AccordionItem
          key={index + 1}
          aria-label={`Q${index + 1}: ${question}`}
          title={`Q${index + 1}: ${question}`}
        >
          {answer}
        </AccordionItem>
      ))}
    </Accordion>
  );
}
