import React from 'react';

function ColorPicker({ label, id, name, color, onChange}) {
    return (
        <div className="mt-3">
            <label htmlFor="color-picker">{label}</label>
            <input
                type="color"
                id={id}
                name={name}
                value={color}
                onChange={onChange}
            />
        </div>
    )
}

export default ColorPicker;