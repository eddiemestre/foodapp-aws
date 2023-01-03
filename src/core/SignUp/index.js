import React, { useState } from "react";
import { GlobalStyle, GridContainer, NoticeContainer, NoticeText } from "./Styles";
import SignUpForm from "./SignUpForm";
import Footer from "../../shared/components/Footer";
import { useTransition } from "@react-spring/web";

const SignUp = () => {
    const [confirmationCodeAlert, setConfirmationCodeAlert] = useState(false)
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
            <GridContainer>
                <SignUpForm setConfirmationCodeAlert={setConfirmationCodeAlert}/>
            </GridContainer>
            <Footer />
        </>

    );
};

export default SignUp;