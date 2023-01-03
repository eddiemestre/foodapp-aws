import styled, { createGlobalStyle } from "styled-components";
import { animated } from "@react-spring/web";

export const GlobalStyle = createGlobalStyle`
    body {
        background-color: #121212;
        font-family: 'Open Sans', sans-serif;
        position: fixed;
        overflow: hidden;
        width: 100%;
    }
`;

export const GridContainer = styled.div`
    margin-top: 50px;
    box-sizing: border-box;
    width: 100%;
    height: calc(100% - 50px);
    overflow: scroll;
    ${'' /* background: pink; */}
    ${'' /* display: flex; */}
    ${'' /* align-items: center; */}
`;

export const NoticeContainer = styled(animated.div)` 
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80%;
    left: 10%;
    margin-top: 35%;
    background: #C56679;
    color: white;
    z-index: 6000;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    font-family: 'Open Sans', sans-serif;
`;

export const NoticeText = styled.div` 
    margin: auto;
    text-align: center;
`;