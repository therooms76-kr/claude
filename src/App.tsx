import { useState } from "react";
import { Header } from "./components/Header";
import { StoryCard } from "./components/StoryCard";
import { StoryDetail } from "./components/StoryDetail";

interface Story {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
}

const stories: Story[] = [
  {
    id: "1",
    title: "10 Healthy Meal Prep Ideas for Busy Parents",
    excerpt: "Discover quick and nutritious meal prep strategies that save time while keeping your family healthy and satisfied throughout the week.",
    content: "Being a parent means juggling countless responsibilities, and meal planning often takes a backseat. However, with these simple meal prep ideas, you can ensure your family eats healthy without spending hours in the kitchen.\n\nStart your week by preparing versatile proteins like grilled chicken, baked salmon, or roasted chickpeas. These can be mixed and matched with different vegetables and grains throughout the week. Invest in good quality containers that are microwave and dishwasher safe.\n\nBatch cooking soups and stews on Sundays can provide quick lunches for the entire week. Consider making a large pot of vegetable soup or chicken chili that freezes well. Don't forget to prep healthy snacks like cut vegetables, fruit portions, and homemade energy balls to keep hunger at bay between meals.",
    image: "https://images.unsplash.com/photo-1670164745517-5b41d4660613?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZGlldCUyMGZvb2R8ZW58MXx8fHwxNzYyMzI3MTY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Diet & Nutrition",
    author: "Sarah Johnson",
    date: "Nov 3, 2025",
    readTime: "5 min read",
  },
  {
    id: "2",
    title: "Building Confidence Through Play: Activities for Toddlers",
    excerpt: "Learn how simple play activities can help develop your toddler's confidence, social skills, and emotional intelligence.",
    content: "Play is not just fun—it's the primary way young children learn about the world and develop crucial life skills. Through play, toddlers build confidence, learn to solve problems, and develop social and emotional intelligence.\n\nOpen-ended toys like blocks, art supplies, and pretend play items allow children to use their imagination and make their own decisions. This autonomy is crucial for building confidence. When children create something on their own, they experience a sense of accomplishment that builds self-esteem.\n\nPhysical play activities like climbing, jumping, and balancing help toddlers understand their body's capabilities. Outdoor play provides opportunities for exploration and risk-taking in a controlled environment. Remember to praise effort over results, and allow children to struggle a bit before offering help—this teaches resilience and problem-solving skills.",
    image: "https://images.unsplash.com/photo-1637277040662-7261512caed8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJlbnQlMjBjaGlsZCUyMHBsYXlpbmd8ZW58MXx8fHwxNzYyMzA2NzMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Parenting",
    author: "Michael Chen",
    date: "Nov 1, 2025",
    readTime: "6 min read",
  },
  {
    id: "3",
    title: "Our Family Adventure to the Amalfi Coast",
    excerpt: "A comprehensive guide to exploring Italy's stunning Amalfi Coast with kids, including family-friendly restaurants and hidden gems.",
    content: "Traveling to the Amalfi Coast with children might seem daunting, but it turned out to be one of our most memorable family vacations. The breathtaking coastal views, delicious food, and warm Italian hospitality made it an unforgettable experience.\n\nWe started our journey in Positano, staying in a family-run hotel with spectacular views of the sea. The steep stairs were a challenge with our stroller, but the locals were incredibly helpful and welcoming. Our kids loved exploring the colorful streets and eating gelato at every opportunity.\n\nOne of the highlights was taking a boat tour along the coast. The children were mesmerized by the crystal-clear water and hidden caves. We also visited Ravello, a quieter town with beautiful gardens perfect for a family picnic. The key to traveling with kids is maintaining flexibility in your schedule and embracing the slower Italian pace of life.",
    image: "https://images.unsplash.com/photo-1542105726-7982ea78fb59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjB0cmF2ZWwlMjBiZWFjaHxlbnwxfHx8fDE3NjIzMjcxNjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Family Travel",
    author: "Emily Rodriguez",
    date: "Oct 28, 2025",
    readTime: "8 min read",
  },
  {
    id: "4",
    title: "Must-Have Nursery Products That Actually Work",
    excerpt: "After testing dozens of baby products, here are the items that truly made a difference in our daily routine with a newborn.",
    content: "As new parents, we were overwhelmed by the endless array of baby products on the market. After six months with our little one, we've identified the products that genuinely improved our lives versus those that just took up space.\n\nThe game-changer was investing in a quality sound machine and blackout curtains. These two items transformed our baby's sleep patterns, which in turn gave us much-needed rest. A comfortable nursing chair with good back support is also worth every penny—you'll spend countless hours in it.\n\nFor feeding, we loved our convertible high chair that grows with the baby. It saved money in the long run and reduced clutter. Skip the wipe warmer and fancy diaper pails—a regular trash can with a lid works perfectly fine. The best advice we can give is to start with the basics and add items as you discover real needs, rather than buying everything before the baby arrives.",
    image: "https://images.unsplash.com/photo-1685358332341-f1e6d357dfa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWJ5JTIwcHJvZHVjdHMlMjBudXJzZXJ5fGVufDF8fHx8MTc2MjIyMTk0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Product Reviews",
    author: "David Park",
    date: "Oct 25, 2025",
    readTime: "7 min read",
  },
  {
    id: "5",
    title: "The Truth About Keto: A Parent's Perspective",
    excerpt: "My honest experience with the ketogenic diet while managing a busy household and caring for two active kids.",
    content: "I started the ketogenic diet three months ago, hoping to lose the stubborn weight I'd been carrying since my second child was born. As a busy parent, I was skeptical about maintaining such a restrictive diet, but the results have been surprising.\n\nThe first two weeks were challenging as my body adjusted. I experienced the infamous 'keto flu' with fatigue and headaches. However, meal planning became easier once I found keto-friendly recipes that the whole family enjoyed. Cauliflower rice, zucchini noodles, and lettuce wraps became staples in our household.\n\nThe biggest benefit has been sustained energy throughout the day without the afternoon crashes I used to experience. I've lost 15 pounds, but more importantly, I feel healthier and more focused. The key is preparation—I spend Sunday afternoons batch cooking keto-friendly meals and snacks to make weekday dinners stress-free.",
    image: "https://images.unsplash.com/photo-1609915437515-9d0f0166b537?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWFsJTIwcHJlcCUyMGhlYWx0aHl8ZW58MXx8fHwxNzYyMzI1NjA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Diet & Nutrition",
    author: "Lisa Thompson",
    date: "Oct 22, 2025",
    readTime: "6 min read",
  },
  {
    id: "6",
    title: "Educational Toys That Grow With Your Child",
    excerpt: "Invest in these versatile learning toys that adapt to different developmental stages and provide years of educational play.",
    content: "As parents, we want to give our children toys that are both fun and educational. After years of testing various products, I've found that the best investments are toys that can grow with your child and adapt to different developmental stages.\n\nBuilding blocks are the ultimate open-ended toy. Our three-year-old started with simple stacking, and now our six-year-old creates elaborate structures and even uses them for math lessons. Magnetic tiles are another favorite—they teach spatial awareness, engineering concepts, and creativity.\n\nArt supplies like washable markers, clay, and child-safe scissors encourage creativity at every age. A good quality play kitchen has been used daily for three years in our house, evolving from simple pretend play to complex role-playing scenarios. The key is choosing high-quality, open-ended toys that don't dictate how they should be used, allowing children's imagination to lead the play.",
    image: "https://images.unsplash.com/photo-1761682753542-421c80ae8be2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2RkbGVyJTIwbGVhcm5pbmclMjB0b3lzfGVufDF8fHx8MTc2MjMyNzE2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Product Reviews",
    author: "Amanda White",
    date: "Oct 20, 2025",
    readTime: "5 min read",
  },
  {
    id: "7",
    title: "Hiking in the Rocky Mountains with Kids",
    excerpt: "Tips and trail recommendations for families wanting to explore the beautiful Rocky Mountains with children of all ages.",
    content: "Last summer, we embarked on a week-long adventure in the Rocky Mountains with our kids, ages 4 and 7. It was an incredible experience that taught us valuable lessons about hiking with children in mountain environments.\n\nStart with shorter, easier trails to build confidence and assess your children's abilities. We found that trails with a clear destination—like a waterfall or mountain lake—kept the kids motivated. The trail to Alberta Falls in Rocky Mountain National Park was perfect for our first day, offering stunning views without being too challenging.\n\nPacking is crucial: bring plenty of water, high-energy snacks, sun protection, and layers for changing weather. We learned the hard way that mountain weather can change rapidly. Make the hike fun by turning it into a nature scavenger hunt or teaching kids to identify different plants and animals. Remember, the journey is more important than reaching the summit when hiking with little ones.",
    image: "https://images.unsplash.com/photo-1661198852527-9f86d5e95630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjB2YWNhdGlvbiUyMG1vdW50YWluc3xlbnwxfHx8fDE3NjIyMzU3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Family Travel",
    author: "Robert Martinez",
    date: "Oct 18, 2025",
    readTime: "7 min read",
  },
  {
    id: "8",
    title: "Kitchen Gadgets That Make Healthy Cooking Easier",
    excerpt: "The essential kitchen tools that have transformed my approach to cooking nutritious family meals efficiently.",
    content: "Investing in the right kitchen gadgets can make the difference between dreading meal prep and actually enjoying it. Here are the tools that have revolutionized how I cook healthy meals for my family.\n\nAn Instant Pot is truly life-changing for busy families. It cuts cooking time dramatically and makes even tough cuts of meat tender and delicious. I use it for everything from quick weeknight dinners to batch cooking beans and grains for the week. A high-quality blender is also essential for smoothies, soups, and sauces.\n\nA food processor saves countless hours of chopping vegetables, and a mandoline slicer creates uniform cuts that cook evenly. Don't underestimate the value of good knives and a large cutting board—they make prep work much more efficient. Finally, investing in quality storage containers means you can easily store and reheat healthy meals throughout the week, eliminating the temptation of takeout.",
    image: "https://images.unsplash.com/photo-1513136917659-7306838e7d82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwZ2FkZ2V0cyUyMG1vZGVybnxlbnwxfHx8fDE3NjIzMjcxNjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Product Reviews",
    author: "Jennifer Lee",
    date: "Oct 15, 2025",
    readTime: "6 min read",
  },
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const filteredStories =
    selectedCategory === "all"
      ? stories
      : stories.filter((story) => {
          const categoryMap: { [key: string]: string } = {
            diet: "Diet & Nutrition",
            parenting: "Parenting",
            products: "Product Reviews",
            travel: "Family Travel",
          };
          return story.category === categoryMap[selectedCategory];
        });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-gray-900 mb-2">
            {selectedCategory === "all"
              ? "All Stories"
              : filteredStories[0]?.category || "Stories"}
          </h2>
          <p className="text-gray-600">
            Discover helpful tips, reviews, and experiences from real families
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <StoryCard
              key={story.id}
              {...story}
              onClick={() => setSelectedStory(story)}
            />
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No stories found in this category yet.
            </p>
          </div>
        )}
      </main>

      {selectedStory && (
        <StoryDetail
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
}
