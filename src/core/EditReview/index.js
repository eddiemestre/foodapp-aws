import React, { useState, useContext, useEffect } from "react"
import EditReviewModule from "./EditReviewModule/index.js";
import { useTransition } from '@react-spring/web';
import { Container, 
    GlobalStyle, 
    SvgContent, 
    ButtonContainer, 
    FaderDivClose, 
    ModalContainer, 
    NoticeContainer, 
    NoticeText } from './Styles.js';
import { useNavigate, useParams } from "react-router-dom";
import DiscardModal from "../../shared/components/DiscardModal/index.js";
import NotFound from "../../shared/components/NotFound/index.js";
import DataContext from "../../shared/context/DataContext.js";
import SingleReviewContext from "../../shared/context/SingleReviewContext.js";
import { deleteReview } from "../../graphql/mutations.js";
import { API, graphqlOperation } from "aws-amplify";
import { formatDate } from "../../shared/utils/FormatDate.js";
import { useExitPrompt } from "../../hooks/useUnsavedChangesWarning.js";
import { errors } from "../../shared/utils/errors.js";

const EditReview = () => {

    // hooks
    const navigate = useNavigate();
    const params = useParams();
    const { userReviewsData, setUserReviewsData, currentReview, setCurrentReview } = useContext(DataContext)
    const { isLoading, notFound} = useContext(SingleReviewContext)
    const [showExitPrompt, setShowExitPrompt] = useExitPrompt()
    const [ errorMessages, setErrorMessages] = useState({})

    // state
    const [discardModal, setDiscardModal] = useState(false)     // animates discard modal in and out
    const [inputHasChanged, setInputHasChanged] = useState(false)   // determines if discard modal should animate
    const [discardType, setDiscardType] = useState('')
    const [onEdit, setOnEdit] = useState(true)
    const [editReviewError, setEditReviewError] = useState(false)
    const [deleteReviewError, setDeleteReviewError] = useState(false)
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // reset state of showExitPrompt to false when component
    // is unmounted
    useEffect(() => {
        return () => {
            setShowExitPrompt(false)
        }
    }, [])

    // edit review - onRest function for the react-spring component
    const PauseEditReviewErrorAlertAnimation = async () => {
        await delay(5000);
        setEditReviewError(false)
    }

    // edit review - react spring component to create an alert that animates 
    // in and out after 5 seconds
    const EditReviewErrorAppear = useTransition(editReviewError, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
        reverse: editReviewError,
        delay: 500,
        onRest: () => PauseEditReviewErrorAlertAnimation(),
    });

    // delete review - onRest function for the react-spring component
    const PauseDeleteReviewErrorAlertAnimation = async () => {
        await delay(5000);
        setDeleteReviewError(false)
    }

    // delete review - react spring component to create an alert that animates 
    // in and out after 5 seconds
    const DeleteReviewErrorAppear = useTransition(deleteReviewError, {
        from: { opacity: 0, transform: "translateY(-20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(-20px)" },
        reverse: deleteReviewError,
        delay: 500,
        onRest: () => PauseDeleteReviewErrorAlertAnimation(),
    });

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


    const DeleteThisReview = async () => {
        // console.log("delete review from database")
        try {
            // console.log("in try delete")
            const response = await API.graphql(graphqlOperation(deleteReview, {input: {id: (params.id).toString()}} ))
            const responseData = response.data.deleteReview
            // console.log("response", response)
            // console.log("data", responseData)
            
            // remove review from local list
            if (userReviewsData) {
                // console.log("wipe review from user review data")
                const reviewsList = userReviewsData.filter(review => (review.id).toString() !== params.id)
                setUserReviewsData(reviewsList)
            } else {    // wipe current review data
                // console.log("wipe current review data")
                setCurrentReview(null)
            }
            setDiscardModal(false)
            setInputHasChanged(false)
            setShowExitPrompt(false)
            navigate(`/feed`)
            // navigate(`/user/${params.username}/`)
        } catch (err) {
            // console.log(err);
            // set error alert
            setDiscardModal(false)  // still want to lose the discard modal when alert appears
            setDeleteReviewError(true)
            return;
        }
    }

    const EditAppear = useTransition(onEdit, {
        from: { opacity: 0, transform: "translateY(20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(20px)" },
        reverse: (() => setOnEdit(false)),
        delay: 300,
    });


    const ModalConditions = () => {
        setDiscardType("edit")
        if (inputHasChanged === false) {
            // console.log("review modal true, changing to false. No changes detected")
            // navigate(`/user/${params.username}/${params.id}`)
            navigate(`/feed/${params.id}/`)
            
        } else {
            // console.log("Discard Modal false, changing to True")
            setDiscardModal(true)
        }
    }


    const DiscardChanges = () => (
        <SvgContent onClick={() => {ModalConditions()}}
            xmlns="http://www.w3.org/2000/svg"
            width="61"
            height="61"
            fill="none"
            viewBox="0 0 61 61"
        >
            <circle cx="30.71" cy="30.71" r="30" fill="#C56679"></circle>
            <path
                fill='white'
                d="M29.673 21.393H31.741999999999997V40.013999999999996H29.673z"
            ></path>
            <path
                fill='white'
                d="M21.398 31.738H23.467V50.358999999999995H21.398z"
                transform="rotate(-90 21.398 31.738)"
            ></path>
        </SvgContent>
    )

    const clickYes = async () => {
        if (discardType === "edit") {
            setDiscardModal(false)
            setInputHasChanged(false)
            setShowExitPrompt(false)
            // navigate(`/user/${params.username}/${params.id}`)
            navigate(`/feed/${params.id}`)
        } else {
            await DeleteThisReview()
        }
    }

    const clickNo = () => {
        setDiscardModal(false)
        setDiscardType('') 
    }

    return (
        <>
            <GlobalStyle />
            {!isLoading && !notFound &&  
                <>
                    {EditReviewErrorAppear((style, item) =>
                        item ? 
                        <NoticeContainer style={style}>
                            <NoticeText>Issue editing review, please try again.</NoticeText>
                        </NoticeContainer>
                        : ''
                    )}
                    {DeleteReviewErrorAppear((style, item) =>
                        item ? 
                        <NoticeContainer style={style}>
                            <NoticeText>Issue deleting review, please try again.</NoticeText>
                        </NoticeContainer>
                        : ''
                    )}
                    <Container>
                        <EditReviewModule 
                            setDiscardModal={setDiscardModal} 
                            setDiscardType={setDiscardType}
                            setInputHasChanged={setInputHasChanged}
                            inputHasChanged={inputHasChanged}
                            setEditReviewError={setEditReviewError}
                            setShowExitPrompt={setShowExitPrompt}
                        />
                    </Container>
                    {EditAppear((style, item) =>
                        item ? 
                        <ButtonContainer style={style}>{DiscardChanges()}</ButtonContainer>
                        : '')
                    }
                    
                    {discardModal && (backgroundOverlay((style, item) =>
                        item 
                        ? <FaderDivClose style={style}/> 
                        : '' ))
                    }
                    
                    {discardModal && (modalAppear((style, item) => 
                        item 
                        ? <ModalContainer style={style}><DiscardModal type={discardType} clickYes={clickYes} clickNo={clickNo}/></ModalContainer> 
                        : ''))
                    }  
                </>
            }
            {!isLoading && notFound && 
                <NotFound />
            }
        </>
    );
    

}

export default EditReview;