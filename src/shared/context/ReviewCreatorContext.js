import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import {SvgComponent, FaderDivClose, ModalContainer, ButtonContainer} from './Styles';
import React, { createContext, useEffect, useState } from 'react';
import { useTransition} from '@react-spring/web';
import DiscardModal from "../components/DiscardModal";
import useAuth from "../../hooks/useAuth";
import { useExitPrompt } from "../../hooks/useUnsavedChangesWarning";

const ReviewCreatorContext = createContext({});

export const ReviewCreatorProvider = ({ children }) => {
    const [fill, setFill] = useState('#03dac6')
    const [stroke, setStroke] = useState('black')

    const [reviewModuleActive, setReviewModuleActive] = useState(false)     // sets rotation of button
    const [discardModal, setDiscardModal] = useState(false)     // animates discard modal in and out
    const [inputHasChanged, setInputHasChanged] = useState(false)   // determines if discard modal should animate
    const [animateButton, setAnimateButton] = useState(true)     // animates review adder/discarder button
    const [urlIsUser, setUrlIsUser] = useState(false)    // ensures button only appears when on the logged in user's feed
    
    const [ showExitPrompt, setShowExitPrompt ] = useExitPrompt();

    // hooks
    const { auth } = useAuth();
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // check if we are on the logged in user's feed
    useEffect(() => {
        if (params?.username) {
            if (params.username === auth?.username) {
                setUrlIsUser(true)
            } else {
                setUrlIsUser(false)
            }
        }
    }, [params, auth])

    // useEffect(() => {
    //     console.log("in use effect")
    //     console.log("reviewModuleActive", reviewModuleActive)
    //     console.log("discardModal", discardModal)
    //     console.log("inputHasChanged", inputHasChanged)
    // }, [reviewModuleActive, discardModal, inputHasChanged])

    // useEffect(() => {
    //     console.log("set reviewModuleActive to false")
    //     setReviewModuleActive(false)
    // }, [discardModal])

    // changes review toggle mode depending on page
    useEffect(() => {
        if (location.pathname === `/${auth?.username}/create-review`) {
            toggleReviewOn();
            setReviewModuleActive(true)
        } else {
            toggleReviewOff()
            setReviewModuleActive(false)
        }
    }, [params, location])

    // animate button on first load or refresh
    useEffect(() => {
        setAnimateButton(true)
    }, [])

    // reset state of showExitPrompt to false when component
    // is unmounted
    useEffect(() => {
        return () => {
            // console.log("set show exit prompt")
            setShowExitPrompt(false)
        }
    }, [setShowExitPrompt])

    const toggleReviewOn = () => {
        setFill('#C56679')
        setStroke('white')
    }

    const toggleReviewOff = () => {
        setFill('#03dac6')
        setStroke('black')
        const scrollY = document.body.style.top;
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    const backgroundOverlay = useTransition(discardModal, {
        from: { opacity: 0 },
        enter: {opacity: 0.5},
        leave: {opacity: 0 },
    });

    const modalAppear = useTransition(discardModal, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
    });

    const animateButtonAppear = useTransition(animateButton, {
        from: { opacity: 0, transform: "translateY(20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(20px)" },
        reverse: !animateButton,
        delay: 300,
    });


    const clickYes = () => {
        toggleReviewOff()
        setDiscardModal(false)
        setReviewModuleActive(false)
        setInputHasChanged(false)
        setShowExitPrompt(false)
        navigate(`/${auth?.username}/feed`)
    }


    const clickNo = () => {
        setDiscardModal(false) 
    }

    // handle navigation depending on whether input has changed
    const ModalConditions = () => {

        // if user clicked the createReviewButton
        if (reviewModuleActive === false) {
            // console.log("review modal false, changing to true")
            // set the fill and toggle review on
            toggleReviewOn()
            // set the review module to active
            setReviewModuleActive(true)
            // navigate to create-review
            navigate(`/${auth?.username}/create-review`);
            
        } else {    // if reviewModuleActive is true, we are currently in the create-review module
            if (inputHasChanged === false) {    // if no changes were made, don't show Discard Modal
                // console.log("review modal true, changing to false. No changes detected")
                toggleReviewOff()
                setReviewModuleActive(false)
                navigate(`/${auth.username}/feed`)
            } else {
                // console.log("Discard Modal false, changing to True")
                setDiscardModal(true)
            }
        }
    }

    // hovering button on bottom corner for creating review
    const createReviewButton = () => (
        <SvgComponent isActive={reviewModuleActive} onClick={() => {ModalConditions()}}
            xmlns="http://www.w3.org/2000/svg"
            width="61"
            height="61"
            fill="none"
            viewBox="0 0 61 61"
        >
            <circle cx="30.71" cy="30.71" r="30" fill={fill}></circle>
            <path
                fill={stroke}
                d="M29.673 21.393H31.741999999999997V40.013999999999996H29.673z"
            ></path>
            <path
                fill={stroke}
                d="M21.398 31.738H23.467V50.358999999999995H21.398z"
                transform="rotate(-90 21.398 31.738)"
            ></path>
        </SvgComponent>
    )

    // animate the reviewButton in depending on where we are coming from
    const AnimateReviewButton = (animate) => {
        if (animate) {
            // console.log("animating review button")
            return (
                animateButtonAppear((style, item) =>
                item ? 
                <ButtonContainer style={style}>{createReviewButton()}</ButtonContainer>
                : ''
                )
            )
        } else {
            // console.log("not animating review button")
            return (
                <ButtonContainer>{createReviewButton()}</ButtonContainer>
            )
        }
    }

  return (
    <>
        <ReviewCreatorContext.Provider value={{ 
                setReviewModuleActive,
                toggleReviewOff,
                setInputHasChanged,
        }}>
            {children}
        </ReviewCreatorContext.Provider>
        {urlIsUser ?
            AnimateReviewButton(animateButton)
        : '' }
        {backgroundOverlay((style, item) =>
            item 
            ? <FaderDivClose style={style}/> 
            : '' )}
    
        {discardModal && (modalAppear((style, item) => 
            item 
            ? <ModalContainer style={style}><DiscardModal type="create" clickYes={clickYes} clickNo={clickNo}/></ModalContainer> 
            : ''))}    
    </>
  )
}

  export default ReviewCreatorContext;