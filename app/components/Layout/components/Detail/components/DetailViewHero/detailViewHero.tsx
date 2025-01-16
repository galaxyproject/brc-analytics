import { BackPageTabs } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { SubTitle } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/components/SubTitle/subTitle";
import { TEXT_HEADING } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { HeroTitle as Typography } from "@databiosphere/findable-ui/src/components/common/Title/title.styles";
import { ReactNode } from "react";
import {
  DetailViewHeroHeadline,
  DetailViewHero as DetailViewHeroLayout,
  HeroHeader,
  HeroTitle,
  Titles,
} from "./detailViewHero.styles";

export interface DetailViewHeroProps {
  breadcrumbs?: ReactNode;
  subTitle?: ReactNode;
  tabs?: ReactNode;
  title?: ReactNode;
}

export const DetailViewHero = ({
  breadcrumbs,
  subTitle,
  tabs,
  title,
}: DetailViewHeroProps): JSX.Element => {
  return (
    <DetailViewHeroLayout>
      {(breadcrumbs || title) && (
        <DetailViewHeroHeadline>
          <HeroHeader>
            {breadcrumbs}
            <HeroTitle>
              <Titles>
                {title && (
                  <Typography component="h1" variant={TEXT_HEADING}>
                    {title}
                  </Typography>
                )}
                {subTitle && <SubTitle subTitle={subTitle} />}
              </Titles>
            </HeroTitle>
          </HeroHeader>
        </DetailViewHeroHeadline>
      )}
      {tabs && <BackPageTabs>{tabs}</BackPageTabs>}
    </DetailViewHeroLayout>
  );
};
