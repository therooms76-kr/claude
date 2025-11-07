interface HeaderProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function Header({ selectedCategory, onCategoryChange }: HeaderProps) {
  const categories = [
    { id: "all", label: "All" },
    { id: "diet", label: "Diet & Nutrition" },
    { id: "parenting", label: "Parenting" },
    { id: "products", label: "Product Reviews" },
    { id: "travel", label: "Family Travel" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo and Title */}
        <div className="py-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">
            Lifestyle <span className="text-indigo-600">Blog</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Real stories, practical tips, and honest reviews for modern families
          </p>
        </div>

        {/* Category Navigation */}
        <nav className="py-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${
                    selectedCategory === category.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
