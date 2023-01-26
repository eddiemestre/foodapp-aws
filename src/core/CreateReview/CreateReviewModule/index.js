import React, {useState, useContext } from "react";
import { DetailsContainer, 
    Head, 
    AddSpot, 
    Save, 
    InputTitle, 
    InputText, 
    VisibilityToggle, 
    LargeInputText, 
    DatePick, 
    SwitchContainer, 
    InsideContainer,
    ContentContainer,
    GridContainer} from './Styles.js';
import "react-datepicker/dist/react-datepicker.css";
import ToggleSwitch from "../../../shared/components/ToggleSwitch/index.js";
import ReviewContent from "../../../shared/components/ReviewContent/index.js";
import './datepicker.scss';
import { formatDate } from "../../../shared/utils/FormatDate.js";
import { useTransition } from '@react-spring/web';
import { useNavigate } from "react-router-dom";
import DataContext from "../../../shared/context/DataContext.js";
import { API } from "aws-amplify";
import useAuth from "../../../hooks/useAuth.js";
import ReviewCreatorContext from "../../../shared/context/ReviewCreatorContext.js";
import { useExitPrompt } from "../../../hooks/useUnsavedChangesWarning.js";

// form for creating a review / posting to database
const CreateReviewModule = ({ setcreateReviewError }) => {
    const navigate = useNavigate();
    const { setReviewModuleActive,
        toggleReviewOff,
        setInputHasChanged } = useContext(ReviewCreatorContext)
    const { auth } = useAuth();
    const { userReviewsData, setUserReviewsData } = useContext(DataContext)
    const [writeReviewModal, setWriteReviewModal] = useState(false);
    const [dateValue, setDateValue] = useState('');
    const [isPrivate, setIsPrivate] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [reviewContent, setReviewContent] = useState('');
    const [reviewTitle, setReviewTitle] = useState('');
    const [showExitPrompt, setShowExitPrompt] = useExitPrompt();

    const checkPrivate = () => {
        if (isPrivate) {
            return "Visible only to you";
        } else {
            return "Visible to all";
        }
    }

    // Run this function whenever input fields 
    // are edited
    const onChange = () => {
        setInputHasChanged(true)
        setShowExitPrompt(true)
        // // console.log("input has changed set to true")
    }

    // updates date values when user updates date field
    const onChangeDate = (date) => {
        // console.log("date", date)
        // we need this to always give us the user time zone date
        // do we need to ensure the time is sent to the backend as well?
        if (date) {
            setDateValue(date)
            setStartDate(date)
        } else {
            setDateValue(null)
            setStartDate(null)
        }
        onChange();

        // timezone adjustments. TBD use.
        // if (date) {
        //     const offset = date.getTimezoneOffset();
        //     let formattedDate = new Date(date.getTime() - (offset*60*1000))
        //     setDateValue(formattedDate)
        //     setStartDate(date)
        //     onChange()
        // } else {
        //     setStartDate(null)
        //     setDateValue(null)
        // }
    }

    // Runs when review field is clicked
    // sets writeReviewModal state to animate in the 
    // review module input field
    // sets onChange to true
    const onThoughtsClick = () => {
        setWriteReviewModal(true);
        onChange();
    }

    const slideAnimation = useTransition(writeReviewModal,  {
        from: {y: 1000},
        enter: {y: 0},
        leave: {y: 1000},
    });

    // runs when user clicks "done" when writing in
    // review modal
    const MyThoughtsDone = () => {
        setWriteReviewModal(false)
    }

    // update title
    const onTitleChange = (event) => {
        setReviewTitle(event.target.value);
        // console.log(reviewTitle);
        onChange()
    }

    /**
     * saves new review
     * creates object for review data and optionally adds date
     * if date if populated.
     * Once review is saved, adds formatted date fields to the response Data
     * and adds that data to the local userReviewsData state
     */
    const SaveNewReview = async (event) => {
        event.preventDefault();

        // set review object to save
        let reviewToSave = {
            title: reviewTitle,
            private: isPrivate,
            content: reviewContent,
            updatedAt: new Date(),
            createdAt: new Date()
        }

        // if date exists, save the date as well
        if (startDate) {
            // console.log("has date")
            reviewToSave['date'] = dateValue
        } 


        // tries to save review
        try {
            // console.log("response", response)
            const requestInfo = {
                response: true,
                body: reviewToSave
            }
            const reviewData = await API.post('foodappreviewsapi', `/reviews/${auth.identityId}`, requestInfo)
            let responseData = reviewData.data
            // console.log("responseData", responseData)

            // grab the id to be returned and used in the URL
            const id = responseData?.review_id

            // add formatted date values
            responseData["updatedAt_formatted"] = formatDate(responseData.updatedAt)
            responseData["date_formatted"] = formatDate(responseData.date)

            // sort reviews by date and alphabetical order
            if (userReviewsData.reviewData) {
                const allReviews = [...userReviewsData.reviewData, responseData];
                allReviews.sort((a, b) =>  (a.date===null)-(b.date===null) || new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title))
                setUserReviewsData({
                    reviewData: allReviews,
                    username: auth?.username
                })

                // debugging
                // console.log("all reviews", allReviews)
            }

            // Clean Up Variables
            CleanUpVariables();

            // use id to navigate to proper review after creation
            navigate(`/${auth?.username}/feed/${id}`)
            
        } catch (err) {
            // console.log(err)
            setcreateReviewError(true)
        }
    }

    // resets component states to default
    const CleanUpVariables = () => {
        setReviewModuleActive(false);
        setInputHasChanged(false)
        toggleReviewOff()
        setDateValue('');
        setIsPrivate(0);
        setStartDate(null);
        setReviewContent('');
        setReviewTitle('');
    }

    // format to UTC - use TBD
    // const formatUTC = (dateInt, addOffset = true) => {
    //     let date = (!dateInt || dateInt.length < 1) ? new Date() : new Date(dateInt);
    //     if (typeof dateInt === "string") {
    //         // // console.log("formatUTC date", date)
    //         return date;
    //     } else {
    //         const offset = addOffset ? date.getTimezoneOffset() : -(date.getTimezoneOffset());
    //         const offsetDate = new Date();
    //         offsetDate.setTime(date.getTime() + offset * 60000)
    //         // // console.log("formatUTC offset", offsetDate)
    //         return offsetDate;
    //     }
    // }


    return (
        <DetailsContainer>
            <form onSubmit={SaveNewReview}>
                <GridContainer>
                <Head>
                    <AddSpot>Add A Spot</AddSpot>
                    <Save>Save</Save>
                </Head>
                <InsideContainer>
                    <InputTitle>I Went To</InputTitle>
                    <InputText placeholder="restaurant, cafe, bar..." value={reviewTitle} type="text" name="uname" onChange={onTitleChange} required />
                    <InputTitle>On</InputTitle>
                    <DatePick
                        selected={startDate ? new Date(startDate) : null}
                        onChange={(date) => onChangeDate(date)}
                        maxDate={(new Date())}
                        dateFormat="MMM d, yyyy"
                        isClearable
                        placeholderText="enter date..."
                        calendarClassName="datepicker"
                    />
                    <InputTitle>My Thoughts</InputTitle>
                    <LargeInputText placeholder= "add review..." type="text" name="review" value={reviewContent} onClick={onThoughtsClick} readOnly="readOnly">
                    </LargeInputText>
                    <InputTitle>Make Private?</InputTitle>
                    <SwitchContainer>
                        <ToggleSwitch label="label" isPrivate={isPrivate} setIsPrivate={setIsPrivate} setInputHasChanged={setInputHasChanged}/>
                    </SwitchContainer>
                    <VisibilityToggle>{checkPrivate()}</VisibilityToggle>
                    <br/>
                    <br/><br/><br/><br/><br/><br/>
                </InsideContainer>
                {slideAnimation((style, item) => 
                    item ? <ContentContainer style={style}><ReviewContent saveReview={MyThoughtsDone} setReview={setReviewContent} title={reviewTitle} editTitle={onTitleChange} review={reviewContent}></ReviewContent></ContentContainer> : ''
                )}
                </GridContainer>
            </form>
        </DetailsContainer>
    );
};

export default CreateReviewModule;