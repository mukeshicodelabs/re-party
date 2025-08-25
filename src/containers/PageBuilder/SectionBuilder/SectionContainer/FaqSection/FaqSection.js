import React, { useState } from 'react';
import classNames from 'classnames';
import css from './FaqSection.module.css';
import feature1 from '../../../../../assets/images/feature-1.png';
import feature2 from '../../../../../assets/images/feature-2.png';
import feature3 from '../../../../../assets/images/feature-3.png';
import feature4 from '../../../../../assets/images/feature-4.png';
import feature6 from '../../../../../assets/images/feature-6.png';
import BrandIconCard from '../../../../../components/BrandIconCard/BrandIconCard';
import { NamedLink } from '../../../../../components';

const faqList = [
  {
    faqTitle: "What is ReParty",
    faqDescription: "ReParty is a peer-to-peer marketplace where you can buy, rent, or sell party decor. Whether you're planning a birthday, baby shower, or bridal bash — find unique pieces locally or ship them nationwide."
  },
  {
    faqTitle: "How does renting work on ReParty? ",
    faqDescription: "Renting is simple! Browse available items, select your rental dates, and book directly through the platform. The item owner confirms, you coordinate pickup or delivery, enjoy the decor, and return it when you're done."
  },
  {
    faqTitle: "Can I list my party items for rent or sale? ",
    faqDescription: "Yes! Anyone can become a seller or lender on ReParty. Just create a free account, upload photos, add details, and set your price or rental terms. We’ll help you handle payments and logistics. "
  },
  {
    faqTitle: "What are ReParty’s fees? ",
    faqDescription: "Sellers keep 80% of their sale price. ReParty takes a 20% commission to cover platform, processing, and protection features."
  },
  {
    faqTitle: "When will I receive my order? ",
    faqDescription: "Please allow 7-10 business days for delivery. Once your order is placed, the seller prepares your items and either ships them or arranges for local pickup. You’ll receive tracking updates for shipped orders. "
  },
  {
    faqTitle: "When do I get paid for a sale or rental?",
    faqDescription: "ReParty holds funds until 3 days after the buyer confirms delivery or pickup. If they don’t confirm, payment is automatically released 24 hours after the rental start time."
  },
  {
    faqTitle: "How do deliveries or pickups work?",
    faqDescription: "You’ll coordinate directly with the other party. Some sellers offer delivery for a fee, while others prefer local pickup. Be sure to communicate clearly and agree on timing and location in advance. "
  },
  {
    faqTitle: "Can I return an item?",
    faqDescription: "If your item arrives damaged, incorrect, fake, or significantly not as described, you have 3 days after delivery to file a return. If approved, we’ll issue a prepaid label and refund once verified."
  },
]

const FaqSection = props => {
  const {
    sectionId,
  } = props;

  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = index => {
    setOpenIndex(prevIndex => (prevIndex === index ? null : index));
  };

  // Split into two arrays
  const middleIndex = Math.ceil(faqList.length / 2);
  const firstColumn = faqList.slice(0, middleIndex);
  const secondColumn = faqList.slice(middleIndex);

  return (
    <div className={css.faqWrapper}>
      {[firstColumn, secondColumn].map((column, colIndex) => (
        <div className={css.faqColumn} key={colIndex}>
          {column.map((item, i) => {
            const actualIndex = colIndex === 0 ? i : i + middleIndex;
            const isOpen = openIndex === actualIndex;

            return (
              <div className={css.faqCard} key={actualIndex}>
                <div className={css.faqHoverBox} onClick={() => toggleAccordion(actualIndex)}>
                  <div className={css.actionButton}>
                    {isOpen ? (
                      <BrandIconCard type="minus" />
                    ) : (
                      <BrandIconCard type="plus" />
                    )}
                  </div>
                  <div className={css.faqHeading}>{item.faqTitle}</div>
                </div>
                {isOpen && (
                  <div className={css.faqSubHeading}>
                    {item.faqDescription}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default FaqSection;
