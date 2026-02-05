import { motion } from "framer-motion";

const projects = [
  {
    title: "Candy Crush Soda",
    description: "Monetization experiments and ML-powered segmentation for a top-grossing puzzle game.",
    tags: ["Gaming", "ML"],
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Playtomic Social",
    description: "Community-led social layer that boosted retention and match discovery on mobile.",
    tags: ["Social", "Mobile"],
    image:
      "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Tomsfive",
    description: "SaaS workflow improvements with a streamlined onboarding and analytics suite.",
    tags: ["SaaS"],
    image:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80",
  },
];

function Badge({ children }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      {children}
    </span>
  );
}

function ProjectCard({ project }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur transition-transform duration-300 hover:scale-[1.02]">
      <div className="flex min-h-[180px] items-center justify-center overflow-hidden rounded-xl bg-slate-900/30 p-4">
        <img
          src={project.image}
          alt={project.title}
          className="h-full max-h-44 w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-white">{project.title}</h3>
        <p className="mt-2 text-sm text-white/70">{project.description}</p>
        <span className="mt-4 text-sm font-semibold text-white/90 underline-offset-4 transition group-hover:underline">
          View Case Study →
        </span>
      </div>
    </div>
  );
}

export default function ProductPortfolio() {
  return (
    <section className="w-full bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-center">
          <div className="relative flex w-full max-w-sm items-center justify-between rounded-full border border-white/15 bg-white/5 p-1 text-white/80 shadow-[0_12px_32px_rgba(15,23,42,0.4)]">
            <motion.div
              layout
              className="absolute right-1 top-1 h-10 w-10 rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
            />
            <button className="relative z-10 flex h-10 flex-1 items-center justify-center text-sm font-semibold">
              Resume
            </button>
            <button className="relative z-10 flex h-10 flex-1 items-center justify-center text-sm font-semibold">
              Products
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProjectCard project={projects[0]} />
          </div>
          <ProjectCard project={projects[1]} />
          <ProjectCard project={projects[2]} />
        </div>
      </div>
    </section>
  );
}
