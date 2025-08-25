import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  H3,
  Page,
  NamedLink,
  LayoutSideNavigation,
  LayoutSingleColumn,
} from '../../components';
import css from './FAQPage.module.css';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import BrandIconCard from '../../components/BrandIconCard/BrandIconCard';
import { useState } from 'react';

export const FAQPage = props => {
  const intl = useIntl();
  const { scrollingDisabled } = props;

  const title = intl.formatMessage({ id: 'ContactDetailsPage.title' });

  const firstTab = [
    {
      heading: 'What is ReParty?',
      description:
        'ReParty is a peer-to-peer marketplace where you can buy, rent, or sell party decor. Whether you’re planning a birthday, baby shower, or bridal bash — find unique pieces locally or ship them nationwide.',
    },
    {
      heading: 'How does renting work on ReParty?',
      description:
        'Renting is simple! Browse available items, select your rental dates, and book directly through the platform. The item owner confirms, you coordinate pickup or delivery, enjoy the decor, and return it when you’re done.',
    },
    {
      heading: 'Is there a security deposit required for rentals?',
      description:
        'Yes, some rentals may require a security deposit, which is fully refundable if the item is returned on time and in original condition. The amount is set by the lender and outlined during checkout.',
    },
    {
      heading: 'What happens if something is damaged or lost during a rental?',
      description:
        'If an item is returned, damaged, or not returned at all, the renter may be charged up to the replacement value set by the owner. We recommend documenting items before and after each rental to keep things fair for everyone.',
    },
    {
      heading: "What happens if something is damaged during shipment?",
      description: "Buyers must report lost or damaged items with 48hrs of delivery and seller must respond within 72 hours and the seller will submit the claim with the carrier. ",
    },
    {
      heading: 'Can I list my party items for rent or sale?',
      description:
        'Yes! Anyone can become a seller or lender on ReParty. Just create a free account, upload photos, add details, and set your price or rental terms. We’ll help you handle payments and logistics.',
    },
    {
      heading: 'What fee does ReParty charge?',
      description:
        'ReParty charges 20% fee',
    },
    {
      heading: 'Can I offer services like balloon installations or event styling?',
      description:
        'You may list your balloons as rentals or items to sell!',
    },
    // {
    //   heading: 'What if my buyer or renter doesn’t show up?',
    //   description:
    //     'If someone ghosts or cancels last minute, report it through the platform. We’ll review the situation and, if applicable, help you recover lost time or earnings according to our cancellation policy.',
    // },
    {
      heading: 'How do deliveries or pickups work?',
      description:
        'You’ll coordinate directly with the other party. Some sellers offer delivery for a fee, while others prefer local pickup. Be sure to communicate clearly and agree on timing and location in advance.',
    },
    {
      heading: 'How long can I rent an item?',
      description:
        'Rental duration is set by the owner — some offer 1-day rentals, others offer full weekends or weekly rates. You’ll see all timing and availability in the listing.',
    },
    // {
    //   heading: 'How do payouts work for sellers and lenders?',
    //   description:
    //     'You’ll receive your payout after a successful rental or sale, minus a small service fee. Funds are transferred securely to your preferred payout method.',
    // },
  ];

  const orderTrack = [
    {
      heading: "When will I receive my order?",
      description: `Please allow 7-10 business days for delivery. Once your order is placed, the seller prepares your items and either ships them directly or arranges for local pickup. <strong>If you’ve selected local pickup, the seller will coordinate directly with you to schedule a convenient time and location.</strong> You’ll receive tracking updates as soon as they’re available for shipped orders.`
    },
    {
      heading: "Where can I find my tracking info?",
      description: `Tracking is available under: <p><strong>My Purchases</strong> → Select your order → <strong>Tracking Details or check your email.</strong></p> If your item hasn’t shipped within 7 days and the seller is unresponsive, you’ll be able to cancel the order starting on Day 8.`
    },
    {
      heading: "My order hasn’t started tracking. What do I do?",
      description: `USPS can take up to 48 hours to scan your package. Still nothing after that? Contact the seller directly or email <a href="mailto:support@letsreparty.com">support@letsreparty.com</a>`
    },
    {
      heading: "When do I get paid for my sale that shipped?",
      description: "ReParty holds funds until 3 days after the buyer confirms they’ve received their items. Then, funds are released to your Stripe-linked account."
    },
    {
      heading: "What is a 1099-K and who receives one?",
      description: "If you earn $2,500+ on ReParty in a calendar year (or meet your state’s threshold), you’ll receive a 1099-K form in accordance with IRS guidelines. You’ll receive this from Stripe."
    }
  ];

  const shippingPickupTab = [
    {
      heading: 'Can items be shipped or is it local only?',
      description:
        'Both! Some sellers ship decor nationwide (usually for resale items), while rentals are  local pickup or drop-off. Check each listing for delivery or shipping options',
    },
    {
      heading: 'Who pays for delivery or shipping?',
      description:
        'The renter or buyer  pays for delivery or shipping. The item owner sets the delivery fee or shipping method, which is shown upfront at checkout.',
    },
    {
      heading: 'What if someone doesn’t show up for a pickup or return?',
      description:
        'If a buyer or renter doesn’t show, please report it to customer service.. ReParty will review the situation and may enforce cancellation or damage fees to protect your time and items.',
    },
  ];

  const feesPoliciesTab = [
    {
      heading: 'What are ReParty’s fees?',
      description:
        'ReParty takes 20% commission from each transaction (shown before you check out) to help cover payment processing, platform support, and protection features.',
    },
    {
      heading: 'Are there late return fees?',
      description:
        'Yes. Late returns may result in a fee set by the owner — this ensures everyone has a smooth rental experience. Always coordinate timing clearly in advance.',
    },
    {
      heading: 'What is ReParty’s cancellation policy?',
      description:
        'Cancellations before 72 hours are fully refunded. Last-minute cancellations may incur a fee. Each listing shows the cancellation window and terms set by the owner.',
    },
    {
      heading: "What are the seller fees?",
      description: "Sellers keep 80% of their sale price. ReParty takes a 20% fee to cover platform and processing costs."
    }
  ];

  const trustSafetyTab = [
    {
      heading: 'What happens if I have an issue with a buyer or renter?',
      description:
        'ReParty offers dispute resolution for all users. If something goes wrong, reach out to our support team and we’ll step in to help resolve it fairly.',
    },
    {
      heading: 'Are there protections in place for sellers and lenders?',
      description:
        'Yes! Every transaction on ReParty includes basic protections, and deposits can be required for higher-value items. We also encourage photo documentation and in-app communication to protect both parties.',
    },
    {
      heading: 'Do I need to pay taxes on my earnings?',
      description:
        'Possibly. Depending on your location and total earnings, you may need to report your income. Stripe will provide tax documents (like a 1099-K) if applicable.',
    },
  ];

  const accountSetupTab = [
    {
      heading: 'How do I create a ReParty account?',
      description:
        'Just tap “Sign Up,” enter your email or phone, and follow the prompts. You can list items, book rentals, and make purchases once your account is verified. If you are selling items, you must create your stripe account before listings can be published. Don’t worry, Reparty prompts will walk you through this!',
    },
    {
      heading: 'Do I need a business to sell or rent on ReParty?',
      description:
        'Nope! Anyone can join — whether you’re a party parent with leftover birthday decor or a seasoned event planner with inventory to rent out.',
    },
    {
      heading: 'Can I use ReParty if I don’t have social media?',
      description:
        'Absolutely. Social media is optional — your listings live right on the app or website. We’ll handle the visibility so you can focus on your celebrations or sales.',
    },
  ];

  const listingTipsTab = [
    {
      heading: 'How do I make my listing stand out?',
      description:
        'Use bright, clear photos with clean backgrounds, write a helpful description, and include measurements, materials, and styling tips. Reparty AI makes this easy to do within seconds. Rentals with flexible pickup/delivery tend to get more bookings!',
    },
    {
      heading: 'Can I list bundles or sets?',
      description:
        'Yes! You can bundle items like themed party kits (e.g., “Boho Baby Shower Set”) or price them separately. Just be clear in the listing title and details.',
    },
    {
      heading: 'How do I update a listing',
      description:
        'Go to your account > listings > edit. You can change prices, descriptions, or mark items “unavailable” if they’re in use or being cleaned.',
    },
  ];

  const trustReviewSupportTab = [
    {
      heading: 'How are users rated on ReParty?',
      description:
        'After every rental or sale, both parties can leave a review. This helps build trust and makes it easier to spot top lenders, renters, and reliable sellers in your area.',
    },
    {
      heading: 'What if I have a dispute or problem?',
      description:
        'Start by messaging the other party through ReParty. If you can’t resolve it, tap “Report an Issue” and our support team will step in to help mediate.',
    },
    {
      heading: 'Can I block or report someone?',
      description:
        'Yes. If you feel unsafe or someone isn’t following marketplace rules, report their profile directly. Our team investigates every report promptly.',
    },
  ];

  const returnsTab = [
    {
      heading: 'Can I get a refund if a rental isn’t what I expected?',
      description:
        'If an item is significantly misrepresented (wrong size, damaged, missing pieces), contact us within 24 hours of pickup. We’ll investigate and may issue a partial or full refund depending on the situation.',
    },
    {
      heading: 'What if my event is canceled?',
      description:
        'Life happens! Check the cancellation window on your booking — many sellers offer full refunds if you cancel early enough. Last-minute cancellations may result in a fee.',
    },
    {
      heading: 'What if a buyer claims they never received my item?',
      description:
        `If you shipped with tracking and proof of delivery, you're covered. We recommend always using tracked shipping and confirming delivery with a photo when possible. Please contact shipping company in this event.`,
    },
    {
      heading: "What payment methods does ReParty accept?",
      description: `We use <strong>Stripe</strong> to securely process payments. You can use: 
      <ul>
        <li>All major credit/debit cards</li>
        <li>Apple Pay</li>
        <li>Google Pay</li>
        <li>ReParty Credits (if applicable)</li>
      </ul>`
    },
    {
      heading: "Can I return an item?",
      description: `ReParty offers <strong>Buyer Protection</strong>. If your item arrives: 
      <ul>
        <li>Damaged</li>
        <li>Not as described</li>
        <li>Incorrect or missing</li>
        <li>Fake or fraudulent</li>
      </ul>
      <em>You have 3 days after delivery to file a return. If approved, we’ll send you a prepaid label to ship the item back. After verification, we’ll issue a full refund. All returns must be dropped off within 5 days of approval.</em>
      <em>Note: We don’t accept returns for buyer’s remorse or style preferences. If you change your mind, feel free to re-list your item on ReParty!</em>
      `
    }
  ];

  const platformPoliciesTab = [
    {
      heading: 'What types of items are NOT allowed on ReParty?',
      description:
        'We don’t allow the listing of weapons, illegal goods, counterfeit items, or anything unsafe for children. All listings must meet our Community Guidelines and Safety Policy',
    },
    {
      heading: 'Can I list seasonal or holiday items?',
      description:
        'Absolutely! Seasonal themes (like Halloween, Christmas, or NYE decor) perform really well. Be sure to post early to catch planners browsing in advance.',
    },
    {
      heading: 'How does ReParty stay secure?',
      description:
        'All payments are processed through encrypted third-party systems, and communication stays within the app. We also monitor activity for scams and provide support if anything goes wrong.',
    },
    {
      heading: 'Does ReParty offer inspiration or ideas?',
      description:
        'Yes! Our app features a curated feed of styled shoots, trending party themes, and real events using items from our marketplace. Think of it as Pinterest — but shoppable.',
    },
    {
      heading: 'Can I save items I like?',
      description:
        'Definitely. Just tap the heart icon on any listing to add it to your favorites.',
    },
    {
      heading: 'Does ReParty offer insurance?',
      description:
        'We don’t offer formal insurance yet, but renters may be required to leave a refundable deposit. Sellers should also document the condition of items before and after each rental for added protection.',
    },
  ];

  const photosCustomizationTab = [
    {
      heading: 'Can I upload professional photos of my items?',
      description:
        'Yes! Great photos lead to more bookings. Clean, bright shots in natural light (preferably in a styled setting) help customers visualize your pieces in their own event.',
    },
    {
      heading: 'Can I request a custom order or decor color?',
      description:
        'You’re welcome to message sellers to ask if they can customize or source additional pieces. However, availability and custom work are totally up to the seller’s discretion.',
    },
    {
      heading: 'Can I request setup or teardown help?',
      description:
        'Some local lenders offer optional setup services for an added fee. Check the listing description or message the owner before booking to confirm.',
    },
    {
      heading: "What if the seller keeps listing poor-quality items?",
      description: "We monitor ratings and quality. If a seller consistently delivers low-rated or misrepresented items, they may be suspended or removed from the platform to protect our community."
    }
  ];

  const inventoryTab = [
    {
      heading: 'How do I keep track of my rentals?',
      description:
        'You’ll find an easy-to-use dashboard in your account where you can see bookings, upcoming return dates, and your full inventory. You’ll also get reminders via email or text.',
    },
    {
      heading: 'What if I want to rent out my whole inventory or become a vendor?',
      description:
        'Amazing! You can list as many items as you’d like. If you’re a vendor or event stylist, ReParty is a great way to earn passive income from your existing decor between gigs.',
    },
    {
      heading: 'Can I rent out one-of-a-kind or vintage items?',
      description:
        'Yes — in fact, those are some of our most-loved listings! Just be clear about condition and handling instructions, and consider requiring a deposit for irreplaceable pieces.',
    },
    {
      heading: 'How do I scale my rental side hustle?',
      description:
        'Focus on consistent photos, detailed listings, reliable pickups, and 5-star service. Once you get a few great reviews, your items will show up more often — and you’ll build a trusted reputation in your area.',
    },
    {
      heading: 'Can I use ReParty if I have an existing rental business or inventory warehouse?',
      description:
        'Yes — ReParty can help you reach a broader audience and fill in gaps between your bigger bookings. We welcome stylists, venues, planners, and prop rental companies too.',
    },
  ];
  const rentalPickUp = [
    {
      heading: "When do I get paid for a rental on ReParty?",
      description: `Sellers are paid after the rental officially begins—never before. This helps protect both parties and keeps our marketplace running smoothly
      <em>You have two payout options:</em>
      <p><strong>Option 1:</strong> Buyer Confirms Pickup</p>
      <p>If the buyer confirms they’ve picked up the rental item(s), we’ll release your payment right away.</p>
      <p>Buyers will receive a reminder to confirm pickup when the rental starts.</p>
      <p><strong>Option 2:</strong> Automatic Payout After 24 Hours</p>
      <p>If the buyer doesn’t confirm pickup, don’t worry—you’ll still get paid. ReParty will automatically release your payout 24 hours after the scheduled rental start time, assuming no disputes have been reported.</p>
      <p><strong>Note:</strong>
        You must have a connected Stripe account to receive payouts. If you haven’t linked your account yet, head to your Seller Dashboard to set it up—it only takes a few minutes!</p>
      `
    },
    {
      heading: "When do I get paid for rental deliveries on ReParty?",
      description: `Sellers who offer delivery will get paid after the item is successfully delivered—this helps ensure a smooth and trusted experience for both sides
      <em>You have two payout options:</em>
      <p><strong>Option 1:</strong> Buyer Confirms Delivery</p>
      <p>As soon as the buyer confirms the rental item(s) were delivered, your payout is released.</p>
      <p>Buyers will get a prompt to confirm once the rental period starts—no chasing needed!</p>
      <p><strong>Option 2:</strong> Automatic Payout After 24 Hours</p>
      <p>If the buyer doesn’t manually confirm delivery, don’t stress. ReParty will automatically release your payment 24 hours after the scheduled rental start time, as long as no issues have been reported.</p>
      <p><strong>Pro Tip:</strong> We recommend snapping a quick photo when you drop off items—it’s a great way to show proof of delivery if there’s ever a question.</br>
      And don’t forget: you’ll need a connected Stripe account to receive your funds. Set that up in your Seller Dashboard in just a few clicks!</p>
      `
    }
  ];

  const cancellationPolicySale = [
    {
      heading: "When can I cancel a sale order?",
      description: `Either the buyer or the seller may cancel the order at any time <strong>before the seller generates the shipping label.</strong>`
    },
    {
      heading: "What happens once the shipping label is generated?",
      description: `Once the shipping label is generated, cancellations are <strong>not permitted</strong> unless both parties agree <strong>in writing</strong> through ReParty’s messaging system.`
    },
    {
      heading: "What happens if the seller cancels the order?",
      description: `
      <ul>
        <li>The buyer receives a <strong>full refund</strong> of the listing amount.</li>
        <li><strong>Transaction and Stripe processing fees are non-refundable</strong> and will be deducted from the refund amount.</li>
        <li>If shipping was selected, the shipping fee will also be refunded.</li>
      <ul>
      `
    }
  ];

  const cancellationPolicyRent = [
    {
      heading: "When can I cancel a rental order?",
      description: `Either the renter or the provider may cancel the order at any time <strong>before the security deposit is paid.</strong>`
    },
    {
      heading: "What happens once the security deposit is paid?",
      description: `Once the security deposit is paid, cancellations are <strong>not permitted</strong> unless both parties agree <strong>in writing</strong> through ReParty’s messaging system.`
    },
    {
      heading: "What happens if the provider cancels the rental?",
      description: ` 
      <ul>
        <li>The renter receives a <strong>full refund</strong> of the listing amount.</li>
        <li><strong>Transaction and Stripe processing fees are non-refundable</strong> and will be deducted from the refund amount.</li>
        <li>The provider is responsible for covering these transaction and Stripe fees.</li>
        <li>If a delivery fee was paid, it will also be refunded.</li>
      </ul>
      `
    },
    {
      heading: "What happens if the renter cancels the rental?",
      description: `
      <ul>
        <li>The renter receives a <strong>full refund</strong> of the listing amount.</li>
        <li><strong>Transaction and Stripe processing fees are non-refundable</strong> and will be deducted from the renter’s refund.</li>
        <li>If a delivery/shipping fee was paid, it will also be refunded.</li>
      `
    }
  ]


  const tabs = [
    { label: 'ReParty Faq', content: firstTab },
    { label: 'Order & Returns', content: orderTrack },
    { label: 'Shipping & Pickup', content: shippingPickupTab },
    { label: 'Fees & Policies', content: feesPoliciesTab },
    { label: 'Trust & Safety', content: trustSafetyTab },
    { label: 'Account & Setup', content: accountSetupTab },
    { label: 'Listing Tips', content: listingTipsTab },
    { label: 'Trust, Reviews & Support', content: trustReviewSupportTab },
    { label: 'Returns, Refunds & Cancellations', content: returnsTab },
    { label: 'Platform Policies', content: platformPoliciesTab },
    { label: 'Photos, Customization & Setup', content: photosCustomizationTab },
    { label: 'Inventory Management & Growing Your Business', content: inventoryTab },
    { label: 'Rental pick ups & rental deliveries', content: rentalPickUp },
    { label: 'Cancellation Policy For Sale Orders', content: cancellationPolicySale },
    { label: 'Cancellation Policy For Rent Orders', content: cancellationPolicyRent }
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].label);
  const [activeIndex, setActiveIndex] = useState(null);

  const currentFaqs = tabs.find(t => t.label === activeTab).content;

  const handleToggle = index => {
    setActiveIndex(prev => (prev === index ? null : index));
  };

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
          </>
        }
        currentPage="FAQPage"
        helpCenterTab={true}
        footer={<FooterContainer />}
      >
        <div className={css.faqBox}>
          <div className={css.faqMaxContain}>
            <div className={css.faqTitle}>Got questions? We’re here to help!</div>
            <div className={css.contentWrapper}>
              <div className={css.contentTabs}>
                {tabs.map(tab => (
                  <button
                    key={tab.label}
                    onClick={() => {
                      setActiveTab(tab.label);
                      setActiveIndex(null);
                    }}
                    className={tab.label === activeTab ? css.activeTab : ''}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className={css.contentDetail}>
                {currentFaqs.map((item, i) => {
                  const isActive = activeIndex === i;
                  return (
                    <div className={css.faqCard} key={i}>
                      <div className={css.faqHoverBox} onClick={() => handleToggle(i)}>
                        <div className={css.actionButton}>
                          {isActive ? (
                            <BrandIconCard type="minus" />
                          ) : (
                            <BrandIconCard type="plus" />
                          )}
                        </div>
                        <div className={css.headingName}>{item.heading}</div>
                      </div>
                      {isActive && (
                        <div className={css.descriptionDetail} dangerouslySetInnerHTML={{ __html: item.description }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default FAQPage;
