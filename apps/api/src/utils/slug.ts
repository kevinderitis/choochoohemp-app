import slugify from "slugify";

export function makeSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
}
