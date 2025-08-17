import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
}

export const FeatureCard = ({ title, description, Icon }: FeatureCardProps) => {
  return (
    <div className="group p-6 glass-card hover-lift animate-fade-in">
      <div className="h-12 w-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-primary group-hover:text-accent transition-colors duration-300" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:gradient-text transition-all duration-300">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};