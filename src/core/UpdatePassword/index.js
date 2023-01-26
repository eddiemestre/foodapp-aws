import React from "react"
import {    GlobalStyle,
            OuterContainer,
            SettingsContainer,
            PageTitle,
            Container, 
            MyReviews } from './Styles.js';
import PasswordUpdateForm from "./PasswordUpdateForm/index.js";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

// password wrapper
const UpdatePassword = () => {

    const { auth } = useAuth();

    const navigate = useNavigate()
    return (
        <>
            <GlobalStyle />
            <OuterContainer>
                <SettingsContainer>
                    <PageTitle>
                        <MyReviews onClick={(() => navigate(`/${auth?.username}/settings`))}>Settings</MyReviews>
                    </PageTitle>
                    <Container>
                        <PasswordUpdateForm />
                    </Container>
                </SettingsContainer>
            </OuterContainer>
        </>
    )

}

export default UpdatePassword;