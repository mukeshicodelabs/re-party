import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import css from './IconCollection.module.css';

const SHARE_ICON = 'share';

const IconCollection = props => {
  const { className, rootClassName, icon } = props;
  const classes = classNames(rootClassName || css.root, className);

  switch (icon) {
    
    case SHARE_ICON:
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19.59 12L15 7.41V9.87L14.14 10C9.83 10.61 6.91 12.87 5.24 16.33C7.56 14.69 10.44 13.9 14 13.9H15V16.59M13 14.92C8.53 15.13 5.33 16.74 3 20C4 15 7 10 14 9V5L21 12L14 19V14.9C13.67 14.9 13.34 14.91 13 14.92Z"
            fill="#fff"
          />
        </svg>
      );
    default:
      return (
        <svg className={classes} width="29" height="19" viewBox="0 0 29 19">
          <g fill="none" fillRule="evenodd">
            <path
              d="M26.58 19H2.42A2.4004 2.4004 0 0 1 0 16.62V2.38A2.4 2.4 0 0 1 2.42 0h24.16A2.4004 2.4004 0 0 1 29 2.38v14.25c-.0165 1.3216-1.0984 2.3811-2.42 2.37zM10 5.83c0-.46-.35-.83-.78-.83H3.78c-.43 0-.78.37-.78.83v3.34c0 .46.35.83.78.83h5.44c.43 0 .78-.37.78-.83V5.83z"
              fill="#DADDE2"
            />
            <path
              d="M25 15h-3c-.65 0-1-.3-1-1s.35-1 1-1h3c.65 0 1 .3 1 1s-.35 1-1 1zm-6 0h-3c-.65 0-1-.3-1-1s.35-1 1-1h3c.65 0 1 .3 1 1s-.35 1-1 1zm-6 0h-3c-.65 0-1-.3-1-1s.35-1 1-1h3c.65 0 1 .3 1 1s-.35 1-1 1zm-6 0H4c-.65 0-1-.3-1-1s.35-1 1-1h3c.65 0 1 .3 1 1s-.35 1-1 1z"
              fill="#B2B6C1"
            />
          </g>
        </svg>
      );
  }
};

IconCollection.defaultProps = {
  className: null,
  rootClassName: null,
  brand: 'default',
};

IconCollection.propTypes = {
  className: string,
  rootClassName: string,
  brand: string,
};

export default IconCollection;
