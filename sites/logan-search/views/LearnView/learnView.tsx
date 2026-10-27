import { ContentsTab } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/components/ContentsTab/contentsTab";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/outline";
import { LoganHero } from "@logan/components/layout/LoganHero/loganHero";
import { type Props } from "@repo/shared/views/docs/ContentView/types";
import { Content } from "@repo/shared/views/docs/components/Content/content";
import { SectionContent } from "@repo/shared/views/docs/components/SectionContent/sectionContent";
import { MDXRemote } from "next-mdx-remote";
import { Fragment, type JSX } from "react";

/**
 * The shared docs ContentView with the site's own hero in place of BRC's. The
 * Learn page has no hero image, so that slot is left out.
 * @param props - Static props plus the MDX components.
 * @param props.components - MDX components.
 * @returns the docs page, or null when there is no MDX to render.
 */
export const LearnView = ({
  components,
  ...props
}: Props): JSX.Element | null => {
  const { frontmatter, mdxSource, outline, ...contentProps } = props;

  if (!mdxSource) return null;

  const { breadcrumbs, title } = frontmatter || {};

  return (
    <Fragment>
      <LoganHero breadcrumbs={breadcrumbs} head={title} variant="article" />
      <SectionContent
        content={
          <Content>
            <MDXRemote {...mdxSource} components={components} />
          </Content>
        }
        frontmatter={frontmatter}
        outline={
          outline && <Outline outline={outline} Contents={ContentsTab} />
        }
        {...contentProps}
      />
    </Fragment>
  );
};
