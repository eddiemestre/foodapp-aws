import React from "react";
import { Container, Header, TextContainer, Body, Footer, SvgContainer, Text, Greeting } from './Styles.js';
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth.js";
import useLogout from "../../../hooks/useLogout.js";

const MenuModal = ({ setMenuOpened }) => {
    const logout = useLogout();
    const navigate = useNavigate();
    const { auth } = useAuth();


    const closeMenu = () => {
        setMenuOpened(false)
    }

    // when user clicks "Sign Out"
    const signOut = async () => {
        closeMenu();
        await logout();
        navigate(`/login`)
    };

    // if user clicks "Sign Up" (not signed in)
    const signUp = async () => {
        closeMenu();
        navigate('/signup')
    }

    // if user clicks "Sign In" (not signed in)
    const signIn = async () => {
        closeMenu();
        navigate('/login')
    }

    // navigates eto settings (if user signed in)
    const openSettings = async () => {
        closeMenu();
        navigate(`/${auth?.username}/settings`)

    }

    return (
        <Container>
            <Header>
                {auth?.name
                ? <Greeting>Hey, {auth?.name}!</Greeting>
                : <Greeting></Greeting>}
                <SvgContainer onClick={closeMenu} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="rgba(255,255,255,1)"/></SvgContainer>
            </Header>
            
                {auth?.name 
                    ?   <Body>
                            <TextContainer><Text onClick={openSettings}>Settings</Text></TextContainer>
                            <TextContainer><Text onClick={signOut}>Sign Out</Text></TextContainer>
                        </Body>
                    : 
                        <Body>
                            <TextContainer><Text onClick={signIn}>Sign In</Text></TextContainer>
                            <TextContainer><Text onClick={signUp}>Sign Up</Text></TextContainer>
                        </Body>
                }
                
            <Footer>© The Food App, Inc. 2022</Footer>
        </Container>
    );
};

export default MenuModal;