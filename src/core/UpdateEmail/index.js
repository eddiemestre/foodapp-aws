import React, { useState } from "react"
import {    GlobalStyle,
            OuterContainer,
            SettingsContainer,
            PageTitle,
            Container, 
            MyReviews,
            NoticeContainer,
            NoticeText } from './Styles.js';
import EmailUpdateForm from "./UpdateEmailForm/index.js";
import { useNavigate } from "react-router-dom";
import { useTransition } from "@react-spring/web";
import useAuth from "../../hooks/useAuth.js";

// email wrapper
const UpdateEmail = () => {
    const [confirmationCodeAlert, setConfirmationCodeAlert] = useState(false)
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const navigate = useNavigate();
    const { auth } = useAuth();


    const PauseConfirmationAlertAnimation = async () => {
        await delay(5000);
        setConfirmationCodeAlert(false)
    }

    const ResendConfirmationCodeAlert = useTransition(confirmationCodeAlert, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
        reverse: confirmationCodeAlert,
        delay: 500,
        onRest: () => PauseConfirmationAlertAnimation(),
    });

    return (
        <>
            <GlobalStyle />
            {ResendConfirmationCodeAlert((style, item) =>
            item ? 
            <NoticeContainer style={style}>
                <NoticeText>Confirmation code sent!</NoticeText>
            </NoticeContainer>
            : ''
            )} 
            <OuterContainer>
                <SettingsContainer>
                    <PageTitle>
                        <MyReviews onClick={(() => navigate(`/${auth?.username}/settings`))}>Settings</MyReviews>
                    </PageTitle>
                    <Container>
                        <EmailUpdateForm setConfirmationCodeAlert={setConfirmationCodeAlert}/>
                    </Container>
                </SettingsContainer>
            </OuterContainer>
        </>
    )

}

export default UpdateEmail;