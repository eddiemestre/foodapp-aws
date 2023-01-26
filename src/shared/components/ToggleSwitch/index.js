import React from "react";
import "./Styles.css";

/**
 * Toggle Private Review Switch
 * In the database, private is set to 1 (true) or 0 (false)
 */ 
const ToggleSwitch = ({ isPrivate, setIsPrivate, setInputHasChanged, label }) => {

    const triggerToggle = () => {
        if (isPrivate === 0) {
            setIsPrivate(1)
        } else {
            setIsPrivate(0)
        }
        // console.log(isPrivate);
        setInputHasChanged(true)
    }


    return (
        <div className="container">
        <div className="toggle-switch">
            <input checked={isPrivate} onChange={triggerToggle} type="checkbox" className="checkbox"
                name={label} id={label}/>
            <label className="label" htmlFor={label}>
                <span className="inner" />
                <span className="switch" />
            </label>
        </div>
        </div>
    );
};

export default ToggleSwitch;