import React, { useState } from 'react';
import styles from './SplashPage.module.css';
import img1 from '../../assets/images/image1.png';
import img2 from '../../assets/images/image2.png';
import img3 from '../../assets/images/image3.png';
import img4 from '../../assets/images/image4.png';
import cheer from '../../assets/images/chire.png';
import BrandIconCard from '../../components/BrandIconCard/BrandIconCard';
import css from './SplashPage.module.css';

const EmailIcon = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.75 1H16.75C17.7125 1 18.5 1.7875 18.5 2.75V13.25C18.5 14.2125 17.7125 15 16.75 15H2.75C1.7875 15 1 14.2125 1 13.25V2.75C1 1.7875 1.7875 1 2.75 1Z"
      stroke="#949494"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.75L9.75 8.875L1 2.75"
      stroke="#949494"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BagIcon = () => (
  <svg width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="51.9399" cy="31.061" r="28.061" fill="#FFF7E9" />
    <path
      d="M63.2864 76.5643L58.7465 26.6253C58.7294 26.4373 58.6425 26.2624 58.503 26.1351C58.3635 26.0078 58.1815 25.9373 57.9927 25.9374H51.2607L51.381 24.6103C51.5532 22.6825 51.2268 20.7427 50.4332 18.9774C49.6396 17.2121 48.4054 15.6805 46.8492 14.5298C45.293 13.379 43.467 12.6476 41.5466 12.406C39.6263 12.1644 37.6761 12.4205 35.8833 13.1499C34.2542 12.4854 32.4919 12.2127 30.7382 12.3538C28.9845 12.4949 27.2885 13.0458 25.7866 13.9622C24.2848 14.8786 23.0191 16.1349 22.0915 17.6299C21.1639 19.1249 20.6004 20.8168 20.4462 22.5694L20.14 25.9374H12.5935C12.4047 25.9373 12.2227 26.0079 12.0833 26.1352C11.9439 26.2625 11.8571 26.4373 11.8399 26.6253L7.3 76.5643C7.29045 76.6691 7.30284 76.7746 7.33637 76.8743C7.36991 76.974 7.42385 77.0656 7.49476 77.1432C7.56568 77.2209 7.652 77.2829 7.74822 77.3254C7.84445 77.3678 7.94846 77.3897 8.05363 77.3897H62.5326C62.6368 77.3867 62.7394 77.3627 62.8341 77.3192C62.9289 77.2758 63.014 77.2137 63.0843 77.1367C63.1547 77.0597 63.2088 76.9694 63.2435 76.871C63.2782 76.7727 63.2928 76.6684 63.2864 76.5643ZM53.4527 70.1864L46.8074 74.8601L51.1175 27.4507H53.4527V70.1864ZM54.2018 71.5098L60.2062 75.8764H47.9938L54.2018 71.5098ZM61.6281 75.0397L54.966 70.1948V27.4507H57.3018L61.6281 75.0397ZM40.1553 13.8309C41.5114 13.8309 42.8526 14.1135 44.0933 14.6607C45.334 15.2079 46.4471 16.0077 47.3615 17.0091C48.2759 18.0104 48.9716 19.1914 49.4042 20.4766C49.8367 21.7618 49.9967 23.1231 49.8738 24.4735L49.7414 25.9374H42.7779L42.8982 24.6103C43.094 22.5606 42.7188 20.4966 41.814 18.647C40.9093 16.7974 39.5103 15.2343 37.772 14.1306C38.5513 13.9341 39.3516 13.8335 40.1553 13.8309ZM41.2585 25.9374H30.1426L30.4364 22.7065C30.5822 21.0294 31.1618 19.4191 32.1181 18.0337C33.0743 16.6483 34.3745 15.5354 35.8909 14.8043C37.6885 15.6575 39.1803 17.0428 40.1642 18.7724C41.1481 20.5021 41.5764 22.4923 41.3911 24.4735L41.2585 25.9374ZM21.9533 22.7068C22.0739 21.3045 22.498 19.9452 23.1962 18.723C23.8944 17.5009 24.85 16.4452 25.9968 15.6291C27.1435 14.8131 28.4541 14.2561 29.8375 13.9969C31.2209 13.7376 32.6442 13.7823 34.0086 14.1278C32.5755 15.0557 31.373 16.2984 30.4927 17.7613C29.6125 19.2241 29.0776 20.8686 28.929 22.5694L28.6228 25.9374H21.6599L21.9533 22.7068ZM13.2846 27.4507H49.5976L45.1952 75.8764H8.88254L13.2846 27.4507Z"
      fill="#c4984d"
    />
  </svg>
);

const BoxIcon = () => (
  <svg width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="52.7783" cy="31.5127" r="26.5127" fill="#FFF7E9" />
    <g clipPath="url(#clip0_756_101238)">
      <path
        d="M62.4214 26.9699L33.8572 13.1802C33.6039 13.0581 33.309 13.0581 33.0559 13.1802L4.49157 26.9699C4.17308 27.1236 3.9707 27.4461 3.9707 27.7998V61.2889C3.9707 61.6425 4.17308 61.9651 4.49157 62.1188L33.0558 75.9084C33.1824 75.9695 33.3195 76.0001 33.4565 76.0001C33.5935 76.0001 33.7305 75.9695 33.8572 75.9084L62.4214 62.1188C62.7399 61.9651 62.9423 61.6425 62.9423 61.2889V27.7999C62.9423 27.446 62.7398 27.1237 62.4214 26.9699ZM33.4565 15.0335L59.901 27.7998L52.2353 31.5005C52.1868 31.4635 52.1355 31.4293 52.0792 31.4022L25.8144 18.7228L33.4565 15.0335ZM23.7331 19.7648L50.1392 32.5125L44.7309 35.1234L18.3358 22.3809L23.7331 19.7648ZM50.757 34.2607V43.9119L45.7053 46.3507V36.6995L50.757 34.2607ZM61.0992 60.7106L34.378 73.6102V42.1678L40.7519 39.0907C41.2102 38.8695 41.4024 38.3186 41.1811 37.8602C40.9598 37.402 40.4089 37.2096 39.9505 37.431L33.4565 40.5661L30.9012 39.3324C30.4428 39.1109 29.8919 39.3033 29.6706 39.7616C29.4493 40.22 29.6415 40.7709 30.0998 40.9922L32.5349 42.1678V73.6102L5.81381 60.7104V29.268L26.1617 39.0911C26.2909 39.1535 26.4274 39.183 26.5617 39.183C26.9042 39.183 27.2333 38.9911 27.3922 38.6619C27.6135 38.2036 27.4213 37.6526 26.963 37.4313L7.01195 27.7998L16.1667 23.3802L43.8494 36.7444C43.8535 36.75 43.858 36.755 43.8622 36.7606V47.8191C43.8622 48.1362 44.0252 48.431 44.2938 48.5997C44.443 48.6933 44.6132 48.7406 44.7839 48.7406C44.9205 48.7406 45.0575 48.7103 45.1844 48.649L52.0792 45.3204C52.3977 45.1667 52.6001 44.8443 52.6001 44.4906V33.3711L61.0992 29.2681V60.7106Z"
        fill="#c4984d"
      />
      <path
        d="M13.4186 57.1363L9.22676 55.1127C8.76819 54.8912 8.21747 55.0836 7.99617 55.5419C7.77488 56.0003 7.96705 56.5512 8.42537 56.7725L12.6172 58.7961C12.7464 58.8585 12.8829 58.888 13.0172 58.888C13.3597 58.888 13.6888 58.6961 13.8477 58.3669C14.0691 57.9085 13.8769 57.3578 13.4186 57.1363Z"
        fill="#c4984d"
      />
      <path
        d="M17.2765 54.6251L9.23254 50.7418C8.7741 50.5205 8.22325 50.7127 8.00196 51.1711C7.78078 51.6294 7.97296 52.1804 8.43128 52.4017L16.4752 56.285C16.6044 56.3473 16.7409 56.3769 16.8752 56.3769C17.2177 56.3769 17.5468 56.185 17.7057 55.8558C17.927 55.3972 17.7348 54.8463 17.2765 54.6251Z"
        fill="#c4984d"
      />
    </g>
    <defs>
      <clipPath id="clip0_756_101238">
        <rect width="62.9114" height="62.9114" fill="white" transform="translate(2 13.0886)" />
      </clipPath>
    </defs>
  </svg>
);
const FlashIcon = () => (
  <svg width="53" height="50" viewBox="0 0 53 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.7833 29.0905C10.7833 29.0905 25.4381 29.1163 28.5623 32.1631C31.6865 35.21 31.4674 50.0001 31.4674 50.0001H31.4739C31.4739 50.0001 31.2484 35.21 34.3791 32.1631C37.5097 29.1163 52.158 29.0905 52.158 29.0905C52.158 29.0905 37.5033 29.0647 34.3791 26.0178C31.2484 22.9774 31.4739 8.18091 31.4739 8.18091H31.4674C31.4674 8.18091 31.6929 22.9709 28.5623 26.0178C25.4316 29.0647 10.7833 29.0905 10.7833 29.0905Z"
      fill="#F9C442"
    />
    <path
      d="M0 11.595C0 11.595 7.98378 11.6121 9.69299 13.2996C11.4022 14.9871 11.2729 23.1899 11.2729 23.1899C11.2729 23.1899 11.1492 14.9871 12.8528 13.2996C14.5564 11.6121 22.5458 11.595 22.5458 11.595C22.5458 11.595 14.562 11.5778 12.8528 9.89032C11.1492 8.20285 11.2729 0 11.2729 0C11.2729 0 11.3966 8.20285 9.69299 9.89032C7.98941 11.5778 0 11.595 0 11.595Z"
      fill="#F9C442"
    />
    <path
      d="M6.44165 40.2601C6.44165 40.2601 12.1436 40.2706 13.364 41.4412C14.5843 42.6119 14.4937 48.3121 14.4937 48.3121C14.4937 48.3121 14.4084 42.6171 15.6234 41.4412C16.8384 40.2706 22.5458 40.2601 22.5458 40.2601C22.5458 40.2601 16.8438 40.2495 15.6234 39.0789C14.4084 37.9083 14.4937 32.208 14.4937 32.208C14.4937 32.208 14.579 37.903 13.364 39.0789C12.149 40.2495 6.44165 40.2601 6.44165 40.2601Z"
      fill="#F9C442"
    />
  </svg>
);
const CloseIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24.4697 12.4697C24.7626 12.1768 25.2373 12.1768 25.5302 12.4697C25.8231 12.7626 25.8231 13.2373 25.5302 13.5302L13.5302 25.5302C13.2373 25.8231 12.7626 25.8231 12.4697 25.5302C12.1768 25.2373 12.1768 24.7626 12.4697 24.4697L24.4697 12.4697Z"
      fill="#333333"
    />
    <path
      d="M36.25 19C36.25 9.47309 28.5269 1.75 19 1.75C9.47309 1.75 1.75 9.47309 1.75 19C1.75 28.5269 9.47309 36.25 19 36.25C28.5269 36.25 36.25 28.5269 36.25 19ZM37.75 19C37.75 29.3553 29.3553 37.75 19 37.75C8.64466 37.75 0.25 29.3553 0.25 19C0.25 8.64466 8.64466 0.25 19 0.25C29.3553 0.25 37.75 8.64466 37.75 19Z"
      fill="#333333"
    />
    <path
      d="M12.4698 12.4698C12.7444 12.1952 13.1792 12.1778 13.4737 12.4181L13.5304 12.4698L25.5304 24.4698L25.5821 24.5265C25.8225 24.8211 25.805 25.2558 25.5304 25.5304C25.2558 25.805 24.8211 25.8225 24.5265 25.5821L24.4698 25.5304L12.4698 13.5304L12.4181 13.4737C12.1778 13.1792 12.1952 12.7444 12.4698 12.4698Z"
      fill="#333333"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="52.2782" cy="31.7235" r="26.7235" fill="#FFF7E9" />
    <g clipPath="url(#clip0_756_101252)">
      <path
        d="M64.4774 46.1743C63.9678 46.1377 63.5223 46.5229 63.4858 47.0343C62.6423 58.9102 54.7932 68.8168 44.1746 72.8131L51.0938 64.4817C52.3703 62.9447 52.1878 61.525 52.1878 59.5808L54.8291 58.4068C56.233 57.7829 57.1403 56.387 57.1403 54.8506C57.1403 53.3528 55.9216 52.1341 54.4238 52.1341H53.3369L50.9214 47.482C50.1202 45.9391 48.5425 44.9806 46.804 44.9806H41.38C40.3176 44.9806 39.3188 45.3944 38.5675 46.1456C37.9408 46.7726 36.9758 46.8857 36.2205 46.4212L31.4152 43.464V40.0958H34.1502L35.1019 41.3646C35.8978 42.4255 37.5255 42.3023 38.1536 41.136L42.047 33.9053H44.3191C45.3205 33.9053 46.135 33.0906 46.135 32.0894V29.09C47.9107 29.0521 48.5799 26.7361 47.0934 25.7575C38.2228 19.9189 39.1237 20.0807 33.8132 20.0807C33.3006 20.0807 32.8852 20.4962 32.8852 21.0087C32.8852 21.5212 33.3006 21.9367 33.8132 21.9367C38.717 21.9367 37.569 21.7103 45.9676 27.2385C45.0255 27.3043 44.279 28.0917 44.279 29.0501V32.049H42.0232C41.3545 32.049 40.742 32.4148 40.4242 33.0041L36.5492 40.2007C34.8299 37.9088 35.4117 38.2397 31.3753 38.2397C30.3739 38.2397 29.5594 39.0543 29.5594 40.0555V43.4863C29.5594 44.1121 29.8905 44.7048 30.4238 45.0328L35.2482 48.0017C36.7385 48.9188 38.6434 48.6951 39.8803 47.4578C40.281 47.0572 40.8138 46.8365 41.3804 46.8365H46.8043C47.8474 46.8365 48.7939 47.4115 49.2746 48.3372L51.7013 53.0111C52.0149 53.6149 52.6324 53.9901 53.3128 53.9901H54.4242C55.6938 53.9901 55.5207 56.0685 54.0759 56.7106L51.4109 57.8952C49.3054 58.8305 51.2219 61.4232 49.6665 63.2959L40.9201 73.8275C40.1918 74.0093 39.4538 74.1645 38.7067 74.2913V71.104C40.6876 65.444 40.6327 65.7119 40.6327 65.2925V62.0725C40.6327 61.3159 40.1559 60.6313 39.446 60.3691L36.2795 59.1996C35.3188 58.8447 34.6734 57.9183 34.6734 56.8941L34.6725 54.8105C35.2572 51.9416 33.6938 49.1083 30.9554 48.0729L24.132 45.4932L22.6053 38.564C22.4231 37.7384 21.6774 37.1391 20.8318 37.1391H16.6445L14.1739 31.6096L14.8473 30.167C15.651 28.445 15.3033 26.3702 13.9821 25.0046L12.7532 23.7339C14.0488 22.4483 15.4615 21.2806 16.9736 20.2481C20.9074 21.921 20.8204 21.9365 21.3138 21.9365H29.4828C29.9953 21.9365 30.4108 21.5209 30.4108 21.0085C30.4108 20.496 29.9953 20.0804 29.4828 20.0804H21.3221L18.8861 19.0445C28.823 13.3092 41.2251 13.7914 50.7392 20.4184C50.0521 23.2757 52.1722 25.1094 51.548 27.2721C50.5782 30.6316 53.2904 33.4159 55.7526 33.9632C61.4195 35.2226 61.2602 35.2232 61.9564 35.2324C62.7836 37.6395 63.3113 40.1869 63.4917 42.832C63.5265 43.3434 63.9691 43.7305 64.4806 43.6949C64.992 43.6601 65.3783 43.2173 65.3434 42.7059C64.7272 33.6636 60.2889 25.4584 53.3085 19.98C32.45 3.56279 2.07031 18.6739 2.07031 44.8899C2.07031 53.3506 5.365 61.3046 11.3475 67.2872C17.3301 73.2699 25.2842 76.5646 33.7449 76.5646C50.3709 76.5646 64.1627 63.7001 65.3373 47.1656C65.3736 46.6544 64.9887 46.2104 64.4774 46.1743ZM61.2039 33.2732C54.915 31.8755 55.6409 32.1879 54.3367 31.0913C53.3787 30.2861 52.984 28.989 53.3312 27.7867C54.04 25.331 52.5104 23.2847 52.4542 21.7054C56.2382 24.7629 59.2702 28.7264 61.2039 33.2732ZM36.8501 74.5446C19.235 76.394 3.92622 62.5157 3.92622 44.8902C3.92635 37.2943 6.78272 30.354 11.4757 25.0833L12.6474 26.2949C13.4375 27.1117 13.6454 28.3523 13.1648 29.382C12.4869 30.8344 12.0568 31.422 12.4713 32.3501L14.9599 37.9198C15.2518 38.573 15.9025 38.995 16.6179 38.995H20.7991L22.3236 45.9139C22.4561 46.515 22.8789 47.0038 23.4548 47.2215L30.2985 49.8089C32.1806 50.5204 33.2552 52.4679 32.8535 54.4388C32.8055 54.6733 32.8167 54.608 32.8167 56.8939C32.8167 58.6914 33.9496 60.3174 35.6357 60.9405L38.7759 62.1004V65.2855C36.7994 70.933 36.8499 70.6739 36.8499 71.0968V74.5446H36.8501Z"
        fill="#c4984d"
      />
    </g>
    <defs>
      <clipPath id="clip0_756_101252">
        <rect width="63.4118" height="63.4118" fill="white" transform="translate(2 13.1528)" />
      </clipPath>
    </defs>
  </svg>
);

const data = [
  {
    icon: <BagIcon />,
    title: 'Buy or Rent Decor That Fits Your Style',
    description:
      'Shop curated kits and gently-loved party decor you can buy or rent — sustainably and affordably.',
  },
  {
    icon: <BoxIcon />,
    title: 'Sell or Rent Out Your Decor with Ease',
    description:
      'List your once-used items in seconds with AI-powered tools that style, price, and promote for you.',
  },
  {
    icon: <GlobeIcon />,
    title: 'Celebrate with Less Waste',
    description:
      'Give party decor a second life and help reduce the waste from single-use celebrations.',
  },
];

function WaitlistModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className={css.modalOverlay}>
      <div className={css.modalBox}>
        <button className={css.modalClose} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        <div className={css.modalIcon}>
          {/* Confetti/party icon SVG */}
          <img src={cheer} alt="cheer" />
        </div>
        <div className={css.modalHeadline}>Thank You for Joining the ReParty Waitlist!</div>
        <div className={css.modalSubtext}>
          We're thrilled to have you as part
          <br />
          of the ReParty community.
        </div>
        <div className={css.modalDescription}>
          You'll be among the first to explore and enjoy our curated marketplace for buying,
          selling, and renting gently-loved party decor.
        </div>
        <button className={css.modalButton} onClick={onClose}>
          BACK TO HOME
        </button>
      </div>
    </div>
  );
}

function SplashPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const images = [img1, img2, img3, img4];
  const [modalOpen, setModalOpen] = useState(false);

  const handleWaitlistSubmit = e => {
    e.preventDefault();
    setModalOpen(true);
  };

  return (
    <div className={css.container}>
      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <div className={css.mainWrapper}>
        <div className={css.content}>
          {/* Left Section */}
          <div className={css.leftSection}>
            <BrandIconCard type="logo" />
            <h1 className={css.headline}>
              Where <span className={css.highlight}>Party Decor</span>
              <br />
              Gets a Second
              <br />
              <span className={css.highlight}>Celebration</span> <FlashIcon />
            </h1>
            <p className={css.maindescription}>
              ReParty is a new marketplace where you can buy, sell, or rent stylish, gently-loved
              party decor — and help reduce waste with every celebration.
            </p>
            <div className={css.waitlistMessage}>Be the first to know when we launch!</div>
            <form className={css.form} onSubmit={handleWaitlistSubmit}>
              <div className={css.inputRow}>
                <div className={css.emailInputWrapper}>
                  <div className={css.inputWithIcon}>
                    <EmailIcon />
                    <input
                      className={css.input}
                      type="email"
                      placeholder="Email Address*"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className={css.emailInputWrapper}>
                  <input
                    className={css.input}
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                  <span className={css.phoneNote}>
                    Used only for early access or special invites
                  </span>
                </div>
              </div>
              <div className={css.interestRow}>
                <span className={css.interestSection}>I'm interested in:</span>
                <div className={css.checkboxGroup}>
                  <label className={css.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="interest"
                      value="Selling"
                      className={css.checkbox}
                      checked={interest === 'Selling'}
                      onChange={() => setInterest('Selling')}
                    />
                    <span className={css.checkboxLabel}>Selling</span>
                  </label>
                  <label className={css.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="interest"
                      value="Buying"
                      className={css.checkbox}
                      checked={interest === 'Buying'}
                      onChange={() => setInterest('Buying')}
                    />
                    <span className={css.checkboxLabel}>Buying</span>
                  </label>
                  <label className={css.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="interest"
                      value="Both"
                      className={css.checkbox}
                      checked={interest === 'Both'}
                      onChange={() => setInterest('Both')}
                    />
                    <span className={css.checkboxLabel}>Both</span>
                  </label>
                </div>
              </div>
              <button className={css.joinButton} type="submit">
                <span className={css.joinButtonText}>JOIN THE WAITLIST</span>
              </button>
            </form>
          </div>
          {/* Right Section: Images */}
          <div className={css.rightSection}>
            <div className={css.grid}>
              {images.map((img, index) => (
                <div key={index} className={css.gridItem}>
                  <img src={img} alt={`Party ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={css.howWeWork}>
          <div className={css.heading}>How ReParty Works?</div>
          <div className={css.cards}>
            {data.map((item, index) => (
              <div className={css.card} key={index}>
                <span className={css.icon}>{item.icon}</span>
                <div className={css.title}>{item.title}</div>
                <div className={css.description}>{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SplashPage;
