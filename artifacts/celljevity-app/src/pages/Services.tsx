import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatCurrency } from "@/lib/utils";
import type { Doc } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { PageId, NavigationContext } from "../App";

interface ServicesProps {
  onNavigate: (page: PageId, ctx?: NavigationContext) => void;
}

export function Services({ onNavigate }: ServicesProps) {
  const services = useQuery(api.services.list);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  if (services === undefined) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Service Catalog</h1>

        {/* Skeleton Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-lg bg-muted" />
          ))}
        </div>

        {/* Skeleton Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="h-6 w-20 rounded-full bg-muted" />
                  <Skeleton className="h-8 w-24 bg-muted" />
                </div>
                <div className="space-y-4">
                   <Skeleton className="h-5 w-40 bg-muted" />
                   <div>
                     <Skeleton className="h-4 w-full mb-1 bg-muted" />
                     <Skeleton className="h-4 w-3/4 bg-muted" />
                   </div>
                   <Skeleton className="h-10 w-full rounded-lg bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const categories = ["all", ...Array.from(new Set((services as any[]).map((s) => String(s.category))))];

  const filteredServices = services.filter((s: Doc<"services">) => {
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Service Catalog</h1>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 mb-2">
        <Input
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-card border-border text-foreground"
        />
        <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat)}
            className="min-h-[44px]"
          >
            {cat === "all" ? "All Categories" : cat}
          </Button>
        ))}
        </div>
      </div>

      {/* Services Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices?.map((service: Doc<"services">) => (
          <motion.div variants={itemVariants} key={service._id} className="flex h-full">
          <Card className="hover:border-primary/50 transition-colors group flex flex-col w-full">
            <CardContent className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-4">
                <span className="inline-block px-3 py-1 bg-chart-3/10 text-chart-3 text-xs font-medium rounded-full border border-chart-3/20">
                  {service.category}
                </span>
                <span className="text-2xl font-display font-bold text-foreground">
                  {formatCurrency(service.price)}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {service.name}
                </h3>
  
                <p className="text-muted-foreground text-sm mb-6">
                  {service.description || "No description available"}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full mt-auto border-primary text-primary hover:bg-primary/10"
                onClick={() => onNavigate("new-quote", { serviceId: service._id, serviceName: service.name, servicePrice: service.price })}
              >
                Add to Quote
              </Button>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredServices.length === 0 && (
        <Card className="border-dashed bg-transparent border-2">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 opacity-50 text-muted-foreground flex justify-center"><FlaskConical className="w-12 h-12" /></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No services available</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Services will appear here once configured by an administrator or if they match your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
