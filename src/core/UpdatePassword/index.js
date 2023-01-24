import React, { useContext } from "react"
import {    GlobalStyle,
            OuterContainer,
            SettingsContainer,
            PageTitle,
            Container, 
            MyReviews } from './Styles.js';
import PasswordUpdateForm from "./PasswordUpdateForm/index.js";
import { useNavigate } from "react-router-dom";
import DataContext from "../../shared/context/DataContext.js";
import useAuth from "../../hooks/useAuth.js";

const UpdatePassword = () => {
    const { setUpdatedPassword } = useContext(DataContext)
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
                        <PasswordUpdateForm setUpdatedPassword={setUpdatedPassword} />
                    </Container>
                </SettingsContainer>
            </OuterContainer>
        </>
    )

}

export default UpdatePassword;