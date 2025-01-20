import { BarChart3, PieChart, TrendingUp, Wallet } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FeatureCard } from "@/components/FeatureCard";

const features = [
  {
    title: "Expense Tracking",
    description: "Track all your business expenses in one place with automatic categorization.",
    Icon: Wallet,
  },
  {
    title: "Financial Analytics",
    description: "Get detailed insights into your business performance with advanced analytics.",
    Icon: BarChart3,
  },
  {
    title: "Revenue Monitoring",
    description: "Monitor your revenue streams and identify growth opportunities.",
    Icon: TrendingUp,
  },
  {
    title: "Visual Reports",
    description: "Generate beautiful visual reports to better understand your finances.",
    Icon: PieChart,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-gray-200/50 bg-[size:20px_20px] opacity-20" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float blur-xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full animate-float blur-xl" style={{ animationDelay: "1s" }} />
        
        <div className="container mx-auto relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent animate-fade-in">
              Smart Financial Tracking for Your Business
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Take control of your business finances with our powerful tracking and analytics platform.
              Join the waitlist to be first in line when we launch.
            </p>
            
            <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="w-full max-w-md p-4 backdrop-blur-sm bg-white/50 rounded-lg shadow-lg border border-gray-200/50">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                Icon={feature.Icon}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;