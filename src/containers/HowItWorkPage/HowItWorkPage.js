import React from 'react';
import css from './HowItWorkPage.module.css';
import { LayoutSingleColumn, NamedLink, Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import workImage from '../../assets/images/story-2.png';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { isScrollingDisabled } from '../../ducks/ui.duck';

const steps = [
    {
        id: 1,
        title: "Browse & Discover",
        description:
        "Search by theme, style, or location to find unique party décor, props, and accessories from sellers all over the U.S.",
        highlight: "From vintage glassware to epic balloon installs—you’ll find it here.",
        image: workImage,
    },
    {
        id: 2,
        title: "Rent or Buy",
        description:
        `Love it for the weekend? Rent it.
        Want to keep it forever? Buy it.`,
        highlight:
            "Choose your dates, review the details, and checkout in a few clicks.",
        image: workImage,
    },
    {
        id: 3,
        title: "Pick Up or Get It Delivered",
        description:
            "Coordinate directly with your seller for local pickup—or have your items shipped right to your door.",
        highlight: "Simple. Flexible. Totally up to you.",
        image: workImage,
    },
    {
        id: 4,
        title: "Celebrate Big, Waste Less",
        description:
            "Enjoy your party, snap those photos, and soak up the compliments—then return your rentals so they can live to party another day.",
            heightlight: "Sustainable never looked so stylish.",
        image: workImage,
    },
    {
        id: 5,
        title: "Earn While You Party (For Sellers)",
        description:
            "Have beautiful décor collecting dust? List it on ReParty and start earning.",
        highlight: "You set your prices, choose rent or sell, and we’ll connect you with party people who’ll love it as much as you do.",
        image: workImage,
    },
];

function HowItWorkPageComponent(props) {
    const { scrollingDisabled } = props;
    return (
        <Page title="how it work" scrollingDisabled={scrollingDisabled}>
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
                    <div className={css.workContent}>
                        <div className={css.workHeader}>
                            <div className={css.workText}>
                                <span className={css.smallText}>How it Works</span>
                            </div>
                            <div className={css.howWorkText}>How ReParty Works</div>
                            <div className={css.workSubText}>Because throwing unforgettable parties should be fun—not stressful.</div>
                        </div>
                        <div className={css.workListContent}>
                            <div className={css.timeline}>
                                {steps.map((step, index) => {
                                    return(
                                        <div key={step.id} className={css.step}>
                                            <div
                                                className={`${css.imageWrapper} ${index % 2 === 0 ? css.rightStep : css.leftStep
                                                    }`}
                                            >
                                                <img src={step.image} alt={step.title} />
                                            </div>
                                            <div
                                                className={`${css.textWrapper} ${index % 2 === 0 ? css.leftStep : css.rightStep
                                                    }`}
                                            >
                                                <div className={css.stepNumber}>{step.id}</div>
                                                <div className={css.stepTitle}>{step.title}</div>
                                                <p className={css.stepDescription}>{step.description}</p>
                                                <p className={css.highlight}>{step.highlight}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className={css.readyToJoin}>
                            <div className={css.joinTitle}>✨ Ready to join the party?</div>
                            <NamedLink name="SignupPage" className={css.signupRent}>
                                Sign up to Rent, Buy, or Sell  👉
                            </NamedLink>
                            {/* <a href='#' className={css.signupRent}>Sign up to Rent, Buy, or Sell  👉</a> */}
                        </div>
                    </div>
                </div>
            </LayoutSingleColumn>
        </Page>
    )
}

const mapStateToProps = state => {
    return {
        scrollingDisabled: isScrollingDisabled(state),
    };
};

const mapDispatchToProps = dispatch => ({
    // scrollingDisabled: () => dispatch(scrollingDisabled()),
});

const HowItWorkPage = compose(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(HowItWorkPageComponent);

export default HowItWorkPage;