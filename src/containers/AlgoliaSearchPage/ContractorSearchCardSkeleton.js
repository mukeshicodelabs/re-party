import React from 'react';
import styles from './ContractorSearchPage.module.css';

const ProjectCardSkeleton = () => {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonTitle} />
      </div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonText} />
        <div className={styles.skeletonText} />
        <div className={styles.skeletonText} style={{ width: '60%' }} />
      </div>
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonButton} />
        <div className={styles.skeletonDate} />
      </div>
    </div>
  );
};

export default ProjectCardSkeleton; 