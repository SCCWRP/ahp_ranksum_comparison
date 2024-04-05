import React from 'react';
import '../styles/colorpicker.css'

function ColorPicker({ label, id, name, color, onChange}) {
    return (
        <div className="color-picker-container">
            <label htmlFor={id} className="color-picker-label">{label}</label>
            <input
                type="color"
                id={id}
                name={name}
                value={color}
                onChange={onChange}
                className="color-picker-input"
            />
        </div>
    )
}

export default ColorPicker;