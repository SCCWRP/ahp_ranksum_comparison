import React from 'react';

function CalcMethodSelector({ calcMethod, onChange }) {
    return (
      <div className="mt-3">
        <p>Select a Mashup Index calculation method:</p>
        <div className="d-flex align-items-center">
          {/* Iterate through methods if there are many */}
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="mashup-index-method"
              value="ahp"
              checked={calcMethod === 'ahp'}
              onChange={onChange}
            />
            <label className="form-check-label">AHP</label>
          </div>
          <div className="form-check ms-3">
            <input
              className="form-check-input"
              type="radio"
              name="mashup-index-method"
              value="ranksum"
              checked={calcMethod === 'ranksum'}
              onChange={onChange}
            />
            <label className="form-check-label">Rank Sum</label>
          </div>
        </div>
      </div>
    );
  }
  export default CalcMethodSelector;
  