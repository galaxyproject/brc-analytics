import { ContentsTab } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/components/ContentsTab/contentsTab";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/outline";
import { LoganHero } from "@logan/components/layout/LoganHero/loganHero";
import { type Props } from "@repo/shared/views/docs/ContentView/types";
import { Content } from "@repo/shared/views/docs/components/Content/content";
import { MDXRemote } from "next-mdx-remote";
import { Fragment, type JSX } from "react";
import { ArticleSlot, LearnBody, OutlineSlot } from "./learnView.styles";

/**
 * The shared docs content with the site's own hero in place of BRC's, laid
 * out on the site's page frame rather than the shared docs grid. The Learn
 * page has no hero image, so that slot is left out.
 * @param props - Static props plus the MDX components.
 * @param props.components - MDX components.
 * @returns the docs page, or null when there is no MDX to render.
 */
export const LearnView = ({
  components,
  ...props
}: Props): JSX.Element | null => {
  const { frontmatter, mdxSource, outline } = props;

  if (!mdxSource) return null;

  const { breadcrumbs, title } = frontmatter || {};

  return (
    <Fragment>
      <LoganHero breadcrumbs={breadcrumbs} head={title} variant="article" />
      <LearnBody>
        <ArticleSlot>
          <Content>
            <MDXRemote {...mdxSource} components={components} />
          </Content>
        </ArticleSlot>
        {outline && (
          <OutlineSlot>
            <Outline outline={outline} Contents={ContentsTab} />
          </OutlineSlot>
        )}
      </LearnBody>
    </Fragment>
  );
};
