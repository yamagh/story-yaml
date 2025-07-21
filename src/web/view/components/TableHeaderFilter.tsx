import React, { useState } from 'react';

interface TableHeaderFilterProps<T extends string> {
  title: string;
  options: T[];
  selectedOptions: T[];
  onChange: (selected: T[]) => void;
  singleSelection?: boolean;
  allowEmpty?: boolean;
}

export const TableHeaderFilter = <T extends string>({
  title,
  options,
  selectedOptions,
  onChange,
  singleSelection = false,
  allowEmpty = false,
}: TableHeaderFilterProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: T) => {
    if (singleSelection) {
      onChange(selectedOptions.includes(option) ? [] : [option]);
    } else {
      const newSelection = selectedOptions.includes(option)
        ? selectedOptions.filter((item) => item !== option)
        : [...selectedOptions, option];
      onChange(newSelection);
    }
  };

  const handleClear = () => {
    onChange([]);
    setIsOpen(false);
  };

  return (
    <th className="dropdown" style={{ cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
      {title} <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
      {isOpen && (
        <div className="dropdown-menu show" style={{ display: 'block' }} onClick={(e) => e.stopPropagation()}>
          {allowEmpty && singleSelection && (
            <div className="dropdown-item">
              <input
                type="radio"
                id={`${title}-all`}
                name={title}
                checked={selectedOptions.length === 0}
                onChange={handleClear}
                className="form-check-input"
              />
              <label htmlFor={`${title}-all`} className="form-check-label ms-2">
                All
              </label>
            </div>
          )}
          {options.map((option) => (
            <div key={option} className="dropdown-item">
              <input
                type={singleSelection ? 'radio' : 'checkbox'}
                id={`${title}-${option}`}
                name={singleSelection ? title : undefined}
                checked={selectedOptions.includes(option)}
                onChange={() => handleSelect(option)}
                className="form-check-input"
              />
              <label htmlFor={`${title}-${option}`} className="form-check-label ms-2">
                {option}
              </label>
            </div>
          ))}
        </div>
      )}
    </th>
  );
};

