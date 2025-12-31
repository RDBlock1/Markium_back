// utils/slugify.ts
export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      // remove any character that’s not a letter, number, space or hyphen
      .replace(/[^\w\s-]/g, '')
      // collapse whitespace and hyphens into a single hyphen
      .replace(/[\s-]+/g, '-')
  );
}
