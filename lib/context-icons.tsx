import React from "react";
import {
  Home,
  Code,
  Coffee,
  Building,
  Pizza,
  UtensilsCrossed,
  ChefHat,
  Wine,
  Beer,
  Grape,
  Salad,
  CookingPot,
  Croissant,
  IceCreamCone,
  Cake,
  Sandwich,
  Soup,
  Wallet,
  Coins,
  PiggyBank,
  CreditCard,
  Banknote,
  TrendingUp,
  Calculator,
  Receipt,
  Leaf,
  TreePine,
  Sprout,
  Flower,
  TreeDeciduous,
  Flower2,
  LeafyGreen,
  Trees,
  FlaskConical,
  TestTube,
  Beaker,
  Dumbbell,
  Activity,
  Server,
  ServerCog,
  HardDrive,
  Fish,
  Droplets,
  Anchor,
  Gamepad2,
  Joystick,
  Rocket,
  Bot,
  BrainCircuit,
  Brain,
  CircuitBoard,
  Cpu,
  PlugZap,
  BatteryCharging,
  Car,
  Briefcase,
  Inbox,
} from "lucide-react";

export type IconComponent = React.ComponentType<{ className?: string }>;

export const contextIconMap: Record<string, IconComponent> = {
  Home,
  Code,
  Coffee,
  Building,
  Pizza,
  UtensilsCrossed,
  ChefHat,
  Wine,
  Beer,
  Grape,
  Salad,
  CookingPot,
  Croissant,
  IceCreamCone,
  Cake,
  Sandwich,
  Soup,
  Wallet,
  Coins,
  PiggyBank,
  CreditCard,
  Banknote,
  TrendingUp,
  Calculator,
  Receipt,
  Leaf,
  TreePine,
  Sprout,
  Flower,
  TreeDeciduous,
  Flower2,
  LeafyGreen,
  Trees,
  FlaskConical,
  TestTube,
  Beaker,
  // Fitness
  Dumbbell,
  Activity,
  // Homelab
  Server,
  ServerCog,
  HardDrive,
  // Fishkeeping
  Fish,
  Droplets,
  Anchor,
  // Game Development
  Gamepad2,
  Joystick,
  Rocket,
  // LLMs / AI
  Bot,
  BrainCircuit,
  Brain,
  // Electronics
  CircuitBoard,
  Cpu,
  PlugZap,
  BatteryCharging,
  // Legacy/extra icons that might exist in stored contexts
  Car,
  Briefcase,
  Inbox,
};

export function getContextIconComponent(name: string): IconComponent {
  return contextIconMap[name] || Home;
}

// Helper component to render context icons dynamically without creating components during render
export function ContextIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = contextIconMap[iconName] || Home;
  return <Icon className={className} />;
}

export const contextIconOptions: ReadonlyArray<{
  value: string;
  icon: IconComponent;
  label: string;
}> = [
  { value: "Home", icon: Home, label: "Home" },
  { value: "Inbox", icon: Inbox, label: "Inbox" },
  { value: "Code", icon: Code, label: "Coding" },
  { value: "Coffee", icon: Coffee, label: "Kitchen" },
  { value: "Building", icon: Building, label: "Work" },
  // Food & Beverage Icons
  { value: "Pizza", icon: Pizza, label: "Food" },
  { value: "UtensilsCrossed", icon: UtensilsCrossed, label: "Dining" },
  { value: "ChefHat", icon: ChefHat, label: "Cooking" },
  { value: "Wine", icon: Wine, label: "Wine" },
  { value: "Beer", icon: Beer, label: "Beer" },
  { value: "Grape", icon: Grape, label: "Fermentation" },
  { value: "Salad", icon: Salad, label: "Healthy Food" },
  { value: "CookingPot", icon: CookingPot, label: "Meal Prep" },
  { value: "Croissant", icon: Croissant, label: "Bakery" },
  { value: "IceCreamCone", icon: IceCreamCone, label: "Desserts" },
  { value: "Cake", icon: Cake, label: "Baking" },
  { value: "Sandwich", icon: Sandwich, label: "Quick Meals" },
  { value: "Soup", icon: Soup, label: "Comfort Food" },
  // Finance Icons
  { value: "Wallet", icon: Wallet, label: "Personal Finance" },
  { value: "Coins", icon: Coins, label: "Savings" },
  { value: "PiggyBank", icon: PiggyBank, label: "Budget" },
  { value: "CreditCard", icon: CreditCard, label: "Credit" },
  { value: "Banknote", icon: Banknote, label: "Cash" },
  { value: "TrendingUp", icon: TrendingUp, label: "Investments" },
  { value: "Calculator", icon: Calculator, label: "Accounting" },
  { value: "Receipt", icon: Receipt, label: "Expenses" },
  // Plant/Nature Icons
  { value: "Leaf", icon: Leaf, label: "Plants" },
  { value: "TreePine", icon: TreePine, label: "Garden" },
  { value: "Sprout", icon: Sprout, label: "Growing" },
  { value: "Flower", icon: Flower, label: "Flowers" },
  { value: "TreeDeciduous", icon: TreeDeciduous, label: "Trees" },
  { value: "Flower2", icon: Flower2, label: "Gardening" },
  { value: "LeafyGreen", icon: LeafyGreen, label: "Herbs" },
  { value: "Trees", icon: Trees, label: "Forest" },
  // Science/Fermentation Icons
  { value: "FlaskConical", icon: FlaskConical, label: "Brewing" },
  { value: "TestTube", icon: TestTube, label: "Experiments" },
  { value: "Beaker", icon: Beaker, label: "Laboratory" },
  // Fitness
  { value: "Dumbbell", icon: Dumbbell, label: "Fitness" },
  { value: "Activity", icon: Activity, label: "Activity" },
  // Homelab / Servers
  { value: "Server", icon: Server, label: "Server" },
  { value: "ServerCog", icon: ServerCog, label: "Server Admin" },
  { value: "HardDrive", icon: HardDrive, label: "Storage" },
  // Fishkeeping / Aquarium
  { value: "Fish", icon: Fish, label: "Aquarium" },
  { value: "Droplets", icon: Droplets, label: "Water Care" },
  { value: "Anchor", icon: Anchor, label: "Marine" },
  // Game Development
  { value: "Gamepad2", icon: Gamepad2, label: "Game Dev" },
  { value: "Joystick", icon: Joystick, label: "Playtesting" },
  { value: "Rocket", icon: Rocket, label: "Launch" },
  // LLMs / AI
  { value: "Bot", icon: Bot, label: "AI Bot" },
  { value: "BrainCircuit", icon: BrainCircuit, label: "Model" },
  { value: "Brain", icon: Brain, label: "Research" },
  // Electronics / Hardware
  { value: "CircuitBoard", icon: CircuitBoard, label: "Electronics" },
  { value: "Cpu", icon: Cpu, label: "CPU" },
  { value: "PlugZap", icon: PlugZap, label: "Power" },
  { value: "BatteryCharging", icon: BatteryCharging, label: "Battery" },
];