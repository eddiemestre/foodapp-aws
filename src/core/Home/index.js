import React, { useEffect } from "react";
import {GlobalStyle,
        GridContainer,
        PhoneContainer,
        WelcomeContainer,
        TopDiv,
        WelcomeText,
        RegisterButton } from './Styles.js'

import { useTransition } from '@react-spring/web'
import Footer from "../../shared/components/Footer/index.js";
import Phone from '../../static/reviews_iphone-2.png';
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    const phoneAppear = useTransition(true, {
        config: {mass:1, friction:40},
        from: { opacity: 0, transform: "translateY(-10px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        delay: 100
    });

    const TextAppear = useTransition(true, {
        config: {mass:1, friction:40},
        from: { opacity: 0, transform: "translateY(10px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        delay: 100
    });

    useEffect(() => {
        const tempEmail = localStorage.getItem('email') || null
        localStorage.clear()
        if (tempEmail) {
          localStorage.setItem("email", tempEmail)
        }
      }, [])


    return (
        <>
            <GlobalStyle />
            <GridContainer>
              <WelcomeContainer>

                {phoneAppear((style, item) =>
                    item 
                    ? <PhoneContainer style={style} src={Phone} />
                    : ''
                )}
                <TopDiv />
                {TextAppear((style, item) =>
                    item 
                    ? <WelcomeText style={style}>Track your favorite restaurants and tell your friends what's tasty.</WelcomeText>
                    : ''
                )}
                 <RegisterButton onClick={() => navigate('/signup')}>Sign Up</RegisterButton>
              </WelcomeContainer>
            </GridContainer>
            <Footer />
        </>
    );
};

export default Home;