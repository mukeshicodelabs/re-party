import React from 'react';
import css from './OurStoryPage.module.css';
import { LayoutSingleColumn, Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import story1 from '../../assets/images/story-1.png';
import story2 from '../../assets/images/story-2.png';
import story3 from '../../assets/images/story-3.png';
import spark from '../../assets/images/spark.png';
import BrandIconCard from '../../components/BrandIconCard/BrandIconCard';
import missionCover from '../../assets/images/mission-cover.png';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';

const believeContent = [
  {
    icon: <BrandIconCard type="sustainable" />,
    title: 'Sustainable',
    description: 'Give décor a second life and keep it out of landfills.'
  },
  {
    icon: <BrandIconCard type="sustainable" />,
    title: 'Rewarding',
    description: 'Make extra income renting out décor you already own.'
  },
  {
    icon: <BrandIconCard type="sustainable" />,
    title: 'Unique',
    description: 'Discover one-of-a-kind pieces you won’t find anywhere else online.'
  },
]

function OurStoryPageComponent(props) {
      const { scrollingDisabled } = props;
  return (
    <Page title="Our Story - ReParty" scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
          </>
        }
        currentPage="OurStoryPage"
        footer={<FooterContainer />}
      >
        <div className={css.mainContainer}>
          <div>
            <div className={css.storyContent}>
              <div className={css.headerSection}>
                {/* <div className={css.aboutProspect}>ABOUT PROSPECT</div> */}
                <h1 className={css.mainTitle}>Where Parties Meet Purpose</h1>
                <p className={css.mainDescription}>
                  ReParty is a new marketplace where you can buy, sell, or rent stylish,
                  gently-loved party decor — and help reduce waste with every celebration.
                </p>
              </div>

              <div className={css.imagesSection}>
                <div className={css.imageContainer}>
                  <img
                    src={story1}
                    alt="Birthday cake with pink candles"
                    className={css.storyImage}
                  />
                  <img
                    src={story2}
                    alt="New Year's Eve celebration with champagne and confetti"
                    className={css.storyImage}
                  />
                </div>
                <div className={css.imageSingle}>
                  <img src={story3} alt="White party balloons" className={css.storyImage} />
                </div>
              </div>

              <div className={css.storySection}>
                <p className={css.storyParagraph}>
                  ReParty was born out of a simple but universal frustration: spending countless
                  hours planning a beautiful birthday, book club dinner, or even a wedding—only to
                  toss perfectly good party décor in the trash or pack it away, never to see the
                  light of day again.
                </p>
                <p className={css.storySubParagraph}>
                  We're not Silicon Valley tech gurus or Ivy League founders. We're moms. We're
                  sisters. We're friends. We're business owners who understand the joy (and the
                  stress) of hosting. And we knew there had to be a better way.
                </p>
              </div>
            </div>
            <div className={css.sparkContainer}>
              <div className={css.sparkSection}>
                <div className={css.sparkHeader}>
                  <span className={css.sparkIcon}>✨</span>
                  <h2 className={css.sparkTitle}>The Spark</h2>
                </div>

                <div className={css.sparkContent}>
                  <div className={css.sparkTextColumn}>
                    <div className={css.quoteContainer}>
                      <div className={css.quoteMark}>
                        <BrandIconCard type="doublecomma" />
                      </div>
                      <div className={css.mainQuote}>
                        Someone nearby must have one. Why can't I just rent it for one night?
                      </div>
                      <div className={css.quoteAttribution}>- Jill Biancardi, Co-Founder</div>
                    </div>

                    <div className={css.originStory}>
                      <p>
                        One late night, while prepping for a school function, Jill Biancardi—mom of
                        three and professional event stylist—needed a disco ball. She didn't want to
                        buy one just to use it once. That single thought became the moment ReParty was
                        born:
                      </p>

                      <p className={css.platformDescription}>
                        A platform where{' '}
                        <span className={css.highlight}>event planners with extra décor</span> and{' '}
                        <span className={css.highlight}>everyday hosts with big ideas</span> can
                        share, rent, and give décor a second life.
                      </p>
                    </div>
                  </div>

                  <div className={css.sparkImageColumn}>
                    <img
                      src={spark}
                      alt="Silver disco ball reflecting light on wall and floor"
                      className={css.sparkImage}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={css.halfContainer}>
              <div className={css.believeContent}>
                <div className={css.believeHeading}>🎉 What We Believe</div>
                <div className={css.believeSubHeading}>At ReParty, we’re reimagining the way we interact with party décor.</div>
                <div className={css.believeGrid}>
                  {believeContent.map((item, i) => {
                    return (
                      <div className={css.believeCard}>
                        <div className={css.believeIcon}>
                          {item.icon}
                        </div>
                        <div className={css.title}>{item.title}</div>
                        <div className={css.description}>{item.description}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className={css.diyText}>
                From DIY birthdays to Pinterest-worthy weddings, every piece of décor deserves another celebration—and you deserve to be rewarded for sharing it.
              </div>
              <div className={css.missionContainer}>
                <div className={css.missonCoverImage}>
                  <img src={missionCover} alt='mission-image' />
                </div>
                <div className={css.missionContent}>
                  <div className={css.missionHeading}>🌍 Our Mission</div>
                  <div className={css.missionDescription}>
                    <p>We believe great parties shouldn’t come at the cost of your wallet—or the planet.</p>
                    <p>
                      ReParty transforms party décor from a one-time purchase into a community-driven marketplace. <span className={css.boldText}>Your creativity lives on, your décor gets reused, and your hosting game just got easier (and greener).</span>
                    </p>
                    <p>Because the best celebrations are the ones we share—long after the party’s over.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={css.fullContainer}>
                  <div className={css.rentShareTitle}>Rent. Share. Celebrate. Repeat.</div>
                  <div className={css.rentShareSubTitle}>At ReParty, we’re reimagining the way we interact with party décor.</div>
                  <a href="/" className={css.getStartedButton}>
                    Start RePartying Today 👉
                  </a>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
}

const mapStateToProps = state => {
    return {
        scrollingDisabled: isScrollingDisabled(state),
    };
};

const mapDispatchToProps = dispatch => ({
    // scrollingDisabled: () => dispatch(scrollingDisabled()),
});

const OurStoryPage = compose(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(OurStoryPageComponent);

export default OurStoryPage;