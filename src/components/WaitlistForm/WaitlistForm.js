import React from 'react';
import styles from './WaitlistForm.module.css';

function WaitlistForm() {
  return (
    <div className={styles.waitlistFormContainer}>
      <h3>Be the first to know when we launch!</h3>
      <div className={styles.waitlistInputs}>
        <input type="email" placeholder="Email Address*" />
        <input type="text" placeholder="Phone Number" />
      </div>
      <p className={styles.waitlistHints}>Used only for early access or special invites</p>
      <div className={styles.waitlistInterestOptions}>
        <label>
          <input type="checkbox" name="interest" value="selling" /> Selling
        </label>
        <label>
          <input type="checkbox" name="interest" value="buying" /> Buying
        </label>
        <label>
          <input type="checkbox" name="interest" value="both" /> Both
        </label>
      </div>
      <div className={styles.waitlistButton}>
        <button>JOIN THE WAITLIST</button>
      </div>
    </div>
  );
}

export default WaitlistForm; 