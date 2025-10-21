import { OutlineItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/types";
import { serialize } from "next-mdx-remote/serialize";
import { GetStaticPropsResult } from "next/types";
import remarkGfm from "remark-gfm";
import { Frontmatter } from "../frontmatter/types";
import { StaticProps } from "./types";
import { getMatter, sanitizeFrontmatter } from "../frontmatter/utils";
import { rehypeSlug } from "../../../../plugins/rehypeSlug";
import { remarkHeadings } from "../../../../plugins/remarkHeadings";
import { SerializeOptions } from "next-mdx-remote/dist/types";
import { resolveRelativePath } from "../files/utils";

export async function buildStaticProps(
  slug: string[] | undefined,
  frontmatterFn = (
    frontmatter: Frontmatter | undefined
  ): Frontmatter | undefined => frontmatter,
  serializeOptions: SerializeOptions = {}
): Promise<GetStaticPropsResult<StaticProps> | undefined> {
  if (!slug) return;

  // Build the file name from the slug.
  const fileName = slug.join("/").concat(".mdx");

  // Extract frontmatter and content from the MDX file.
  const { content, data } = getMatter(resolveRelativePath([fileName]));
  const frontmatter = frontmatterFn(sanitizeFrontmatter(data));

  // If the frontmatter is hidden, return.
  if (!frontmatter || frontmatter.hidden) return;

  // We expect the frontmatter to have a title.
  if (!frontmatter.title) return;

  // Serialize the MDX content.
  const outline: OutlineItem[] = [];
  const mdxSource = await serialize(content, {
    ...serializeOptions,
    mdxOptions: {
      development: false,
      rehypePlugins: [rehypeSlug],
      remarkPlugins: [[remarkHeadings, outline], remarkGfm],
    },
    scope: { ...serializeOptions.scope, frontmatter },
  });

  return {
    props: {
      frontmatter,
      mdxSource,
      pageTitle: frontmatter.title,
    },
  };
}
