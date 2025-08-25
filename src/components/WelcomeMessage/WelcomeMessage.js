import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import css from './WelcomeMessage.module.css';
import { useLocation } from 'react-router-dom/cjs/react-router-dom.min';

const WelcomeMessage = props => {
  const { className } = props;
  const location = useLocation();
  const pageName = location.pathname;

  const getWelcomeContent = () => {
    if (pageName.startsWith('/profile-') || pageName.startsWith('/account/')) {
      return {
        title: 'Welcome to ReParty',
        subtitle: 'Your Party, Your Way - Sustainably Stylish!',
      };
    } else if (pageName.startsWith('/listings')) {
      return {
        subtitle: 'Manage Your Listings Like a Pro',
      };
    } else if (pageName.startsWith('/inbox/')) {
      return {
        subtitle: 'Manage Your Listings Orders',
      };
    } else if (pageName.startsWith('/favorites')) {
      return {
        subtitle: 'Favorites/Saved listing',
      };
    } else if (pageName.startsWith('/cart')) {
      return {
        subtitle: 'Your Cart',
      };
    }  else if (pageName.startsWith('/my-purchases')) {
      return {
        subtitle: 'My Orders',
      };
    }else if (['/faq', '/contact-support', '/policy'].includes(pageName)) {
      return {
        subtitle: 'Help Center',
      };
    }
    return null;
  };

  const content = getWelcomeContent();

  return (
    <>
      {content && (
        <div className={classNames(css.root, className)}>
          {content.title && <h1 className={css.title}>{content.title}</h1>}
          {content.subtitle && <p className={css.subtitle}>{content.subtitle}</p>}
        </div>
      )}
    </>
  );
};

WelcomeMessage.defaultProps = {
  className: null,
};

WelcomeMessage.propTypes = {
  className: PropTypes.string,
};

export default WelcomeMessage;
