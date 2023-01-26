import React from "react";
import { HeadContainer, AppHead } from './Styles.js';
import { useNavigate } from "react-router-dom";

// current not used
const Header = () => {
    const navigate = useNavigate();

    const handleOnClick = async () => {
        navigate("/")
    }

    return (
        <HeadContainer>
            <AppHead onClick={() => handleOnClick()}>The Food App</AppHead>
        </HeadContainer>
    );
};

export default Header;