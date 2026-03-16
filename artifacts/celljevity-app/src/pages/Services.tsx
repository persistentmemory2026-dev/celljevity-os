import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function Services() {
  const services = useQuery(api.services.list);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...new Set((services || []).map((s) => s.category))];

  const filteredServices = selectedCategory === "all"
    ? services
    : services?.filter((s) => s.category === selectedCategory);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Service Catalog</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat === "all" ? "All Categories" : cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices?.map((service) => (
          <div
            key={service._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {service.category}
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(service.price)}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {service.name}
            </h3>

            <p className="text-gray-600 text-sm mb-4">
              {service.description || "No description available"}
            </p>

            <button
              className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              onClick={() => {/* TODO: Add to quote */}}
            >
              Add to Quote
            </button>
          </div>
        ))}
      </div>

      {(!filteredServices || filteredServices.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          No services found in this category.
        </div>
      )}
    </div>
  );
}
