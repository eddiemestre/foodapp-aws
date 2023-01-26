import React, { useState } from "react";
import { GlobalStyle, GridContainer, NoticeContainer, NoticeContainerError } from "./Styles";
import SignUpForm from "./SignUpForm";
import Footer from "../../shared/components/Footer";
import { useTransition } from "@react-spring/web";

// Signup Wrapper
const SignUp = () => {
    const [confirmationCodeAlert, setConfirmationCodeAlert] = useState(false)
    const [errorCreatingAccount, setErrorCreatingAccount] = useState(false)

    const delay = ms => new Promise(res => setTimeout(res, ms));

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

    const PauseAccountCreationErrorAlertAnimation = async () => {
        await delay(5000);
        setErrorCreatingAccount(false)
    }

    const AccountCreationErrorAlert = useTransition(errorCreatingAccount, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
        reverse: errorCreatingAccount,
        delay: 500,
        onRest: () => PauseAccountCreationErrorAlertAnimation(),
    });
    return (
        <>
            <GlobalStyle />
            {ResendConfirmationCodeAlert((style, item) =>
                item ? 
                <NoticeContainer style={style}>
                    <div>Confirmation code sent!</div>
                </NoticeContainer>
                : ''
            )} 
            {AccountCreationErrorAlert((style, item) =>
                item ? 
                <NoticeContainerError style={style}>
                    <div>Issue creating account. Please try again.</div>
                </NoticeContainerError >
                : ''
            )} 
            <GridContainer>
                <SignUpForm setConfirmationCodeAlert={setConfirmationCodeAlert} setErrorCreatingAccount={setErrorCreatingAccount}/>
            </GridContainer>
            <Footer />
        </>

    );
};

export default SignUp;