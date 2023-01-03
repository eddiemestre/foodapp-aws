import React, { useState, useEffect, useContext } from "react"
import { useTransition } from '@react-spring/web';
import {    GlobalStyle, 
            Container, 
            MyReviews, 
            OuterContainer, 
            PageTitle, 
            SettingsContainer, 
            NoticeContainer, 
            NoticeText} from './Styles.js';
import SettingsForm from "./SettingsForm/index.js";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import DataContext from "../../shared/context/DataContext.js";

const Settings = () => {
    const { auth } = useAuth();
    const { updatedPassword, setUpdatedPassword, updatedEmail, setUpdatedEmail, updatedSettings, setUpdatedSettings } = useContext(DataContext);
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate();

    useEffect(() => {
        if (auth?.name) {
            setIsLoading(false)
        }
    }, [auth])
    
    const delay = ms => new Promise(res => setTimeout(res, ms));

    const PauseEmailAnimation = async () => {
        await delay(5000);
        setUpdatedEmail(false)
      }
      const EmailSuccessAppear = useTransition(updatedEmail, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
        reverse: updatedEmail,
        delay: 500,
        onRest: () => PauseEmailAnimation(),
    });
    
    const PausePasswordAnimation = async () => {
        await delay(5000);
        setUpdatedPassword(false)
      }
      const PasswordSuccessAppear = useTransition(updatedPassword, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
        reverse: updatedPassword,
        delay: 500,
        onRest: () => PausePasswordAnimation(),
    });

    const PauseSettingsAnimation = async () => {
        await delay(5000);
        setUpdatedSettings(false)
      }
      const SettingsSuccessAppear = useTransition(updatedSettings, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
        reverse: updatedSettings,
        delay: 500,
        onRest: () => PauseSettingsAnimation(),
    });

    return (
        <>
            <GlobalStyle />
            {EmailSuccessAppear((style, item) =>
            item ? 
            <NoticeContainer style={style}>
                <NoticeText>Email saved successfully!</NoticeText>
            </NoticeContainer>
            : ''
            )}
            {PasswordSuccessAppear((style, item) =>
            item ? 
            <NoticeContainer style={style}>
                <NoticeText>Password saved successfully!</NoticeText>
            </NoticeContainer>
            : ''
            )}
            {SettingsSuccessAppear((style, item) =>
            item ? 
            <NoticeContainer style={style}>
                <NoticeText>Settings updated successfully!</NoticeText>
            </NoticeContainer>
            : ''
            )} 
            <OuterContainer>
                <SettingsContainer>
                    <PageTitle>
                        <MyReviews onClick={(() => navigate(`/settings`))}>Settings</MyReviews>
                    </PageTitle>
                    <Container>
                        { !isLoading && <SettingsForm />}
                    </Container>
                </SettingsContainer>
            </OuterContainer>
        </>
    )

}

export default Settings;