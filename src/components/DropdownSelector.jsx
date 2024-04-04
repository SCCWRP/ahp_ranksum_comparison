import React from 'react';

function DropdownSelector({ label, options, selectedValue, onChange, id }) {
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <select id={id} value={selectedValue} onChange={onChange}>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }
  
  export default DropdownSelector;
  