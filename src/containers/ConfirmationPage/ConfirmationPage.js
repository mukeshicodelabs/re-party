import React from 'react';
import css from './ConfirmationPage.module.css';
import { Button, LayoutSideNavigation, LayoutSingleColumn, Page } from '../../components';
import CustomTopbar from '../CheckoutPage/CustomTopbar';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { useIntl } from 'react-intl';
import { useConfiguration } from '../../context/configurationContext';
import { pathByRouteName } from '../../util/routes';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import CheckoutPage from '../CheckoutPage/CheckoutPage';
import confirmationImage from '../../assets/images/login-screen.png';
import BrandIconCard from '../../components/BrandIconCard/BrandIconCard';


const ConfirmationPage = (props) => {

  const { params, location } = props;
  const routeConfiguration = useConfiguration();
  const history = useHistory();
  const intl = useIntl();
  const config = useConfiguration();
  // const orderDetailsPath = pathByRouteName('OrderDetailsPage', routeConfiguration, { id: params?.id })


  return (
    <Page >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <div className={css.confirmationWrapper}>
          <div className={css.aiContent}>
            <div className={css.confirmImageBox}>
              <img src={confirmationImage} alt='image' />
            </div>
            <div className={css.confirmDetails}>
              <div className={css.requestHeading}>Your request has been submitted.</div>
              <div className={css.comfirmDescription}>
                Check your email for confirmation and next steps.
              </div>
              <div className={css.comfirmDescription}>
                You can also click below to view more details.
              </div>
              <Button
                type="button"
                className={css.bookingDetailButton}
                onClick={() => history.push(`/order/${params?.id}`)}
              >
                Booking Details
              </Button>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  )
}

export default ConfirmationPage;
