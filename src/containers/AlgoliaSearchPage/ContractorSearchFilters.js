
import React, { useState, useRef, useEffect } from 'react';
import { SearchBox as AlgoliaSearchBox, RefinementList, RangeInput } from 'react-instantsearch';
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import css from './ContractorSearchFilters.module.css';
import { OutsideClickHandler } from '../../components';

const CustomSearchBox = ({ attribute, placeholder, className, refine }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleClear = () => {
    setValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      refine(''); // Clear the search
    }
  };

  const handleSubmit = () => {
    if (inputRef.current && inputRef.current.value) {
      refine(inputRef.current.value);
    }
  };

  return (
    <div className={css.customSearchBox}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <span className={css.searchIcon} onClick={handleSubmit}>🔍</span>
      {value && <span className={css.clearIcon} onClick={handleClear}>✖</span>}
    </div>
  );
};

const ContractorSearchFilters = ({ filters, sortByFilter }) => {
  const [dropdownPositions, setDropdownPositions] = useState({});
  const [popUp, setPopUp] = useState(null);

  const filterRefs = useRef(
    filters.reduce((acc, filter) => {
      acc[filter.attribute] = { triggerRef: useRef(null), dropdownRef: useRef(null) };
      return acc;
    }, {})
  );

  const calculateDropdownPosition = (triggerRef, dropdownRef) => {
    const triggerElem = triggerRef.current;
    const dropdownElem = dropdownRef.current;
    if (!triggerElem || !dropdownElem) return {};
    const triggerRect = triggerElem.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const estimatedDropdownHeight = 200;
    const spaceBelow = windowHeight - triggerRect.bottom;
    let position = spaceBelow >= estimatedDropdownHeight ? { top: triggerRect.bottom + 5 } : { bottom: 10, maxHeight: '80vh', overflowY: 'auto' };
    position.position = 'fixed';
    position.zIndex = 1000;
    position.backgroundColor = '#fff';
    position.boxShadow = '0px 4px 12px 0px rgba(0, 0, 0, 0.25)';
    position.borderRadius = '4px';
    position.minWidth = '200px';
    return position;
  };

  const handleDropdownToggle = attribute => {
    setPopUp(attribute)
    const itemRefs = filterRefs.current[attribute];
    const position = calculateDropdownPosition(itemRefs.triggerRef, itemRefs.dropdownRef);
    setDropdownPositions(prev => ({ ...prev, [attribute]: position }));
  };

  return (
    <div className={css.filters}>
      <Accordion allowZeroExpanded className={css.filterSection}>
        {filters.map(filter => {
          const isOpen = popUp === filter.attribute;
          return (
            <OutsideClickHandler
              // key={filter.attribute}
              onOutsideClick={() => {
                if (isOpen) setPopUp("");
              }}
            >
              <AccordionItem uuid={filter.attribute}>
                <div className={css.filterMenu}>
                  <AccordionItemHeading
                    className={css.filterMenuHeading}
                    ref={filterRefs.current[filter.attribute].triggerRef}
                    onClick={() => handleDropdownToggle(filter.attribute)}
                  >
                    <AccordionItemButton>{filter.title}</AccordionItemButton>
                  </AccordionItemHeading>
                <div
  className={css.filterDropdownMenu}
  ref={filterRefs.current[filter.attribute].dropdownRef}
  style={{
    ...dropdownPositions[filter.attribute],
    display: isOpen ? 'block' : 'none', // keep it mounted but toggle visibility
  }}
>
  <AccordionItemPanel>
    {filter.type === 'RefinementList' && (
      <RefinementList
        attribute={filter.attribute}
        searchablePlaceholder={filter.title}
      />
    )}
  </AccordionItemPanel>
</div>





                </div>
              </AccordionItem>
            </OutsideClickHandler>
          );
        })}

        <div className={css.sortByWrapper}>{sortByFilter}</div>
      </Accordion>
    </div>
  );
};

export default ContractorSearchFilters;
