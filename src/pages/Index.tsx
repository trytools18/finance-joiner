import { BarChart3, PieChart, TrendingUp, Wallet, CreditCard, Clock, DollarSign } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FeatureCard } from "@/components/FeatureCard";
import { ChartContainer } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer } from "recharts";

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

// Sample data for decorative charts
const areaData = [
  { value: 30 },
  { value: 40 },
  { value: 35 },
  { value: 50 },
  { value: 45 },
  { value: 60 },
  { value: 55 },
  { value: 70 },
  { value: 65 },
  { value: 80 },
];

const barData = [
  { month: 'Jan', amount: 1500 },
  { month: 'Feb', amount: 2300 },
  { month: 'Mar', amount: 1800 },
  { month: 'Apr', amount: 2600 },
  { month: 'May', amount: 2100 },
  { month: 'Jun', amount: 2800 },
];

const DecorativeChart = ({ className, type = "area" }: { className?: string; type?: "area" | "bar" }) => (
  <div className={className}>
    <ResponsiveContainer width="100%" height="100%">
      {type === "area" ? (
        <AreaChart data={areaData}>
          <defs>
            <linearGradient id="decorativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(37, 99, 235, 0.2)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0.05)" />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgba(37, 99, 235, 0.3)"
            fill="url(#decorativeGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      ) : (
        <BarChart data={barData}>
          <Bar dataKey="amount" fill="rgba(37, 99, 235, 0.2)" />
        </BarChart>
      )}
    </ResponsiveContainer>
  </div>
);

const DecorativeDashboard = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Main Chart */}
    <div className="absolute top-40 -right-20 w-[500px] h-[300px] bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl opacity-20">
      <DecorativeChart type="bar" className="w-full h-full" />
    </div>

    {/* Stats Cards */}
    <div className="absolute top-20 -left-10 flex gap-4 opacity-20">
      {[
        { icon: DollarSign, value: "$1,500", label: "Revenue" },
        { icon: CreditCard, value: "$500", label: "Expenses" },
        { icon: Clock, value: "$1,200", label: "Pending" },
      ].map((stat, index) => (
        <div
          key={index}
          className="w-[180px] h-[100px] bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl p-4 flex flex-col justify-center"
        >
          <div className="flex items-center gap-2">
            <stat.icon className="w-5 h-5 text-primary/50" />
            <span className="text-lg font-semibold text-gray-800">{stat.value}</span>
          </div>
          <span className="text-sm text-gray-600">{stat.label}</span>
        </div>
      ))}
    </div>

    {/* Transaction List */}
    <div className="absolute bottom-20 left-1/4 w-[400px] h-[200px] bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl opacity-20 p-4">
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3 border-b border-gray-100 pb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-2 w-16 bg-gray-100 rounded mt-1" />
            </div>
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>

    {/* Small Area Charts */}
    <DecorativeChart className="absolute top-60 -left-20 w-[300px] h-[150px] opacity-20 rotate-[5deg]" />
    <DecorativeChart className="absolute bottom-40 right-20 w-[250px] h-[125px] opacity-15 -rotate-[10deg]" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -rotate-12 -translate-y-1/2 -translate-x-1/4 w-[150%] h-[150%] bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 opacity-70" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_500px_at_50%_200px,rgba(37,99,235,0.1),transparent)]" />
        </div>

        {/* Dashboard Elements */}
        <DecorativeDashboard />

        {/* Floating Elements */}
        <div className="absolute top-40 left-[10%] w-64 h-64 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[10%] w-72 h-72 rounded-full bg-gradient-to-r from-secondary/20 to-accent/20 blur-3xl animate-float" style={{ animationDelay: "1s" }} />

        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0V20M20 0V20M0 1H20M0 20H20' stroke='%23E5E7EB' stroke-width='0.5'/%3E%3C/svg%3E")`,
          maskImage: 'linear-gradient(to bottom, transparent, black, transparent)'
        }} />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            {/* Content */}
            <div className="text-center space-y-8">
              <div className="inline-block animate-fade-in">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 text-primary">
                  ✨ Coming Soon
                </span>
              </div>

              <h1 className="text-4xl md:text-7xl font-bold tracking-tight animate-fade-in">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                  Smart Financial Tracking
                </span>
                <br />
                <span className="text-gray-900">
                  for Your Business
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
                Take control of your business finances with our powerful tracking and analytics platform.
                Join the waitlist to be first in line when we launch.
              </p>

              <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <div className="w-full max-w-md">
                  <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08)] p-4 hover:shadow-lg transition-shadow duration-300">
                    <WaitlistForm />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16 animate-fade-in" style={{ animationDelay: "0.6s" }}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">2K+</div>
                  <div className="text-sm text-gray-600">Early Signups</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </div>
                <div className="text-center md:col-span-1 col-span-2">
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
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
