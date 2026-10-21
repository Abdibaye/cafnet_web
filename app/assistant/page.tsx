import type { Metadata } from "next";
import FoodAssistantChat from "@/components/assistant/FoodAssistantChat";

export const metadata: Metadata = {
  title: "AI Food Assistant | Cafnet Ethiopia",
  description:
    "Find where to eat in Addis Ababa within your budget, preferred area, and taste. Grounded in real restaurant menus with verified ETB prices.",
};

export default function AssistantPage() {
  return (
    <div className="w-full bg-background min-h-screen">
      <FoodAssistantChat />
    </div>
  );
}
