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
import { API } from "aws-amplify";

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

    // useEffect(() => {
    //     const tempEmail = localStorage?.email || null
    //     localStorage.clear()
    //     if (tempEmail) {
    //       localStorage.setItem("email", tempEmail)
    //     }
    //   }, [])

    useEffect(() => {
        console.log("in use effect")
        const GetData = async () => {
            console.log("in get data")
            try {
                // Get, Query, Scan
                // const requestInfo = {
                //     // headers: { Authorization: token },
                //     response: true,
                //     // queryStringParameters: {
                //     //     cognitoid: "test",
                //     //     username: "test"
                //     // }
                // }

                // const data = await API.get('lambdaapitest', '/users', requestInfo)

                // should work? - YES
                // Queries work for unauthed users
                // Scans return 404 (no queryStringParameters)
                // const requestInfo = {
                //     response: true,
                //     queryStringParameters: {
                //         uniques_pk: "eddie"
                //     }
                // }
        
                // const data = await API.get('lambdaapitest', '/users', requestInfo)


                // shouldn't work? - doesn't work, good!
                // const requestInfo = {
                //     // headers: { Authorization: token },
                //     response: true,
                //     body: {
                //         cognitoid: "post-test",
                //         username: "post123",
                //         name: "ms. lucy",
                //         verified: false
                //     }
                // }

                // const data = await API.post('lambdaapitest', '/users', requestInfo)

                // console.log(data)
            } catch (err) {
                console.log(err)
            }
        }

        GetData();
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
                 {/* <RegisterButton onClick={() => navigate('/register')}>Sign Up</RegisterButton> */}
                 <RegisterButton onClick={() => navigate('/signup')}>Sign Up</RegisterButton>
              </WelcomeContainer>
            </GridContainer>
            <Footer />
        </>
    );
};

export default Home;