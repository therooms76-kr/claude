interface StoryCardProps {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  onClick: () => void;
}

export function StoryCard({
  title,
  excerpt,
  image,
  category,
  author,
  date,
  readTime,
  onClick,
}: StoryCardProps) {
  return (
    <article
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-full shadow-md">
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{excerpt}</p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-xs">
                {author.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <span className="font-medium text-gray-700">{author}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>{date}</span>
            <span className="text-gray-400">•</span>
            <span>{readTime}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
