import React, { useContext, useState } from "react"
import {    GlobalStyle,
            OuterContainer,
            SettingsContainer,
            PageTitle,
            Container, 
            MyReviews,
            NoticeContainer,
            NoticeText } from './Styles.js';
import EmailUpdateForm from "./UpdateEmailForm/index.js";
import { useOutletContext, useNavigate } from "react-router-dom";
import DataContext from "../../shared/context/DataContext.js";
import { useTransition } from "@react-spring/web";

const UpdateEmail = () => {
    const { setUpdatedEmail } = useContext(DataContext)
    const [confirmationCodeAlert, setConfirmationCodeAlert] = useState(false)
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const navigate = useNavigate();


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
                        <MyReviews onClick={(() => navigate(`/settings`))}>Settings</MyReviews>
                    </PageTitle>
                    <Container>
                        <EmailUpdateForm setUpdatedEmail={setUpdatedEmail} setConfirmationCodeAlert={setConfirmationCodeAlert} />
                    </Container>
                </SettingsContainer>
            </OuterContainer>
        </>
    )

}

export default UpdateEmail;