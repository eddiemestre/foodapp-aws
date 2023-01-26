import React, {useState} from "react"
import { Container, GlobalStyle, NoticeContainer, NoticeText } from './Styles.js';
import CreateReviewModule from "./CreateReviewModule/index.js";
import { useTransition } from '@react-spring/web';

// create review form wrapper
const CreateReview = () => {
    const [createReviewError, setcreateReviewError] = useState(false);
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // onRest function for the react-spring component
    const PauseCreateReviewErrorAlertAnimation = async () => {
        await delay(5000);
        setcreateReviewError(false)
    }

    // react spring component to create an alert that animates in and out
    // after 5 seconds
    const CreateReviewErrorAppear = useTransition(createReviewError, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
        reverse: createReviewError,
        delay: 500,
        onRest: () => PauseCreateReviewErrorAlertAnimation(),
    });

    return (
        <>
           <GlobalStyle />
           {CreateReviewErrorAppear((style, item) =>
            item ? 
            <NoticeContainer style={style}>
                <NoticeText>Issue creating review, please try again.</NoticeText>
            </NoticeContainer>
            : ''
            )}
           <Container>
               <CreateReviewModule    
                    setcreateReviewError={setcreateReviewError}
                />
             </Container>
        </>
    )
}

export default CreateReview;