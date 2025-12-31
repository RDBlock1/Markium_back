export type Post = {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  tags: string[]
  cover: string
  content: string
}

export const posts: Post[] = [
  {
    slug: "designing-for-focus",
    title: "Designing for Focus in a Distracted World",
    excerpt: "Practical techniques to reduce cognitive load with layout, color, and motion.",
    date: "2025-08-14",
    author: "Ava Carter",
    tags: ["Design", "UX"],
    cover: "/dark-ui-hero-cover.png",
    content:
      "Creating focused experiences starts with clear hierarchy. Use scale, spacing, and color to guide attention.\n\nAvoid competing focal points. Every screen should have a single primary action or idea. Motion can reinforce hierarchy when used sparingly.\n\nAudit your pages: if everything is emphasized, nothing is.",
  },
  {
    slug: "motion-that-serves",
    title: "Motion That Serves, Not Distracts",
    excerpt: "How to use Framer Motion to support comprehension, feedback, and flow.",
    date: "2025-07-28",
    author: "Kai Nguyen",
    tags: ["Motion", "React"],
    cover: "/subtle-framer-motion-cover.png",
    content:
      "Motion should clarify changes: entrances, exits, reordering, and feedback states.\n\nPrefer small distances, low duration, and easing that mirrors physical expectation.\n\nReserve dramatic effects for storytelling moments, not routine interactions.",
  },
  {
    slug: "dark-mode-accessibility",
    title: "Dark Mode, Done Right",
    excerpt: "Contrast, elevation, and color choices that make dark UIs readable and calm.",
    date: "2025-06-10",
    author: "Mina Patel",
    tags: ["Accessibility", "UI"],
    cover: "/dark-mode-accessibility-cover.png",
    content:
      "Start with a near-black background and off-white foreground to reduce glow.\n\nUse a restrained palette with a single brand color. Provide sufficient contrast (WCAG AA+) for text and UI elements.\n\nAvoid pure white on pure black; it increases eye strain.",
  },
  {
    slug: "ship-better-content",
    title: "Ship Better Content Faster",
    excerpt: "A practical content workflow: briefs, outlines, drafts, feedback, ship.",
    date: "2025-05-04",
    author: "Noah Kim",
    tags: ["Content", "Process"],
    cover: "/content-workflow-dark-ui-cover.png",
    content:
      "Start with a brief that defines audience, problem, and promise.\n\nOutline your structure before drafting. Draft quickly, then revise slowly with feedback.\n\nShip consistently—momentum beats perfection.",
  },
  {
    slug: "the-grid-is-your-friend",
    title: "The Grid Is Your Friend",
    excerpt: "Use consistent spacing and alignment to simplify complex layouts.",
    date: "2025-03-22",
    author: "Liam Brooks",
    tags: ["Layout", "System"],
    cover: "/grid-system-dark-ui-cover.png",
    content:
      "Pick a spacing scale and stick to it. Group related elements tightly, separate unrelated elements generously.\n\nGrids reduce decisions. They free your attention for the parts that truly matter.",
  },
]
