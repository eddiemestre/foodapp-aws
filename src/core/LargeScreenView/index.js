import React from "react";
import Header from "../../shared/components/Header/index";
import Footer from "../../shared/components/Footer";
import { GlobalStyle, Container, InsideContainer } from "./Styles";

const LargeScreenView = () => {
    return (
        <>
        <GlobalStyle />
        <Container>
            <Header />
            <InsideContainer>
                The Food App is best experienced on a mobile device in portrait mode.  Please come back on one to check it out!
            </InsideContainer>
            <Footer />
        </Container>
        </>
    );
};

export default LargeScreenView;