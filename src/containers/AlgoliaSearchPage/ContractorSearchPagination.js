import React, { useMemo } from 'react';
import css from './ContractorSearchPage.module.css';
import { usePagination } from 'react-instantsearch';
import { createResourceLocatorString } from '../../util/routes';
import { IconArrowHead } from '../../components';

const ContractorSearchPagination = (props) => {
  const { routeConfiguration, setSearchParamss, searchParamss } = props;
  const searchParams = new URLSearchParams(window.location.search);
  const currentPage = parseInt(searchParams.get('page') || '1');

  const { canRefine, currentRefinement, nbPages, refine } = usePagination();

  const getPageNumbers = useMemo(() => {
    const totalPages = nbPages;
    const maxPageNumbers = 3;

    // Convert to zero-based index for internal calculations
    const currentPageIndex = currentPage - 1;

    let startPage = Math.max(0, currentPageIndex - 1);
    let endPage = Math.min(totalPages - 1, startPage + maxPageNumbers - 1);

    if (endPage - startPage < maxPageNumbers - 1) {
      startPage = Math.max(0, endPage - maxPageNumbers + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Always show first page if not included
    if (startPage > 0) {
      pageNumbers.unshift('...');
      pageNumbers.unshift(0);
    }

    // Always show last page if not included
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
      pageNumbers.push(totalPages - 1);
    }

    return pageNumbers;
  }, [nbPages, currentPage]); 
  const handlePagination = (pageIndex) => {
    const pageNumber = pageIndex + 1;

    const updatedParams = {
      ...searchParamss,
      page: pageNumber,
    };

    const flattenSearchParams = (params) => {
      const result = {};

      Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Flatten one level deep (e.g., refinementList.businessCategory)
          Object.entries(value).forEach(([subKey, subVal]) => {
            result[`${subKey}`] = subVal;
          });
        } else {
          result[key] = value;
        }
      });

      return result;
    };
 
    // Flatten filters for URL
    const flatParams = flattenSearchParams(updatedParams); 

    const url = createResourceLocatorString(
      'ContractorSearchPage',
      routeConfiguration,
      {},
      flatParams
    ); 

    refine(pageIndex); // Algolia page change
    // setSearchParamss(updatedParams); // Update local state
    window.history.pushState({}, '', url); // Update URL
  };


  if (!canRefine || nbPages <= 1) {
    return null;
  }

  return (
    <ul className={css.paginationWrapper}>
      <li
        onClick={() => {
          if (currentPage > 1) {
            handlePagination(currentPage - 2); // Convert to zero-based index
          }
        }}
        className={`${css.arrow} ${currentPage === 1 ? css.disabled : ''}`}
      >
        <svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.15991 1.41L3.57991 6L8.15991 10.59L6.74991 12L0.749912 6L6.74991 0L8.15991 1.41Z" fill="#222222"/>
</svg>

      </li>

      <div className={css.pageNumbersContainer}>
        {getPageNumbers.map((page, i) => (
          <li
            key={i}
            className={page === currentPage - 1 ? css.activePage : ''}
          >
            {page === '...' ? (
              <span className={css.ellipsis}>...</span>
            ) : (
              <span
                onClick={() => handlePagination(page)}
                className={css.pageNumber}
              >
                {page + 1}
              </span>
            )}
          </li>
        ))}
      </div>

      <li
        className={`${css.arrow} ${currentPage === nbPages ? css.disabled : ''}`}
        onClick={() => {
          if (currentPage < nbPages) {
            handlePagination(currentPage); // Convert to zero-based index
          }
        }}
      >
        <svg width="9" height="12" viewBox="0 0 9 12" fill="none" version="1.1" transform="matrix(-1,0,0,-1,0,0)">
<path d="M8.15991 1.41L3.57991 6L8.15991 10.59L6.74991 12L0.749912 6L6.74991 0L8.15991 1.41Z" fill="#222222"></path>
</svg>
      </li>
    </ul>
  );
};

export default ContractorSearchPagination;
