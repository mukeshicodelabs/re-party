import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import {FacebookShareButton, LinkedinShareButton, TwitterShareButton, WhatsappShareButton,} from "react-share";
import { IconShare } from "../../components";
import css from './SocialShare.module.css';
import { createSlug } from '../../util/urlHelpers';

const SocialShare = props => {
    const {
        url,
        displayName,
        isListing,
        listingTitle,
        listingID,
        slug,
        userID
    } = props;
    

    const [copyText, setCopyText] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setCopyText(false);
        }, 5000);

        return () => clearTimeout(timer);

    }, [copyText]);

    const displayTitle = isListing ? `Share @${displayName}’s Listing` : `Share @${displayName}’s Store`;
    const listingUrl = `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}/l/${slug}/${listingID}`;
    const userUrl = `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}/u/${userID}`;
    console.log(userUrl, '&&& &&& => userUrl');
    
    return (
        <>

            <div className={css.shareModalWrapper}>
                <h4 className={css.modalTitle}>{displayTitle}</h4>
                <ul className={css.socialLinks}>
                    <li onClick={() => { }}>
                        <div className={css.iconButton}>
                            <IconShare type='link' />
                            {/* <span>Copy link </span> */}
                        </div>
                    </li>
                    <li>
                        <FacebookShareButton
                            url={isListing ? listingUrl:userUrl}
                            quote={displayTitle}
                            className={css.facebookButton}
                        >
                            <IconShare type='fb' />
                        </FacebookShareButton>
                    </li>
                    <li>
                        <LinkedinShareButton
                            title={displayTitle}
                            url={isListing ? listingUrl:userUrl}
                            className={css.linkedinButton}
                        >
                            <IconShare type="linkedinicon" />
                        </LinkedinShareButton>
                    </li>

                    <li>
                        <TwitterShareButton
                            title={displayTitle}
                            className={css.linkedinButton}
                            url={isListing ? listingUrl:userUrl}
                        >
                            <IconShare type="twitter" />
                        </TwitterShareButton>
                    </li>
                    <li>
                        <WhatsappShareButton 
                        url={isListing ? listingUrl:userUrl}
                        title={displayTitle} 
                        className={css.linkedinButton}>
                            <IconShare type="whatsapp" />
                        </WhatsappShareButton>
                    </li>
                </ul>

            </div>


        </>
    );
};

export default SocialShare;
