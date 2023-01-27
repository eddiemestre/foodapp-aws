import React, {useState, useContext, useEffect } from "react";
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
    GridContainer,
    DeleteReview,
    FieldDetailText } from './Styles.js';

import "react-datepicker/dist/react-datepicker.css";
import ToggleSwitch from "../../../shared/components/ToggleSwitch/index.js";
import ReviewContent from "../../../shared/components/ReviewContent/index.js";
import './datepicker.scss';
import { useTransition } from '@react-spring/web';
import { useNavigate, useParams } from "react-router-dom";
import DataContext from "../../../shared/context/DataContext.js";
import useAuth from "../../../hooks/useAuth.js";
import { formatDate } from "../../../shared/utils/FormatDate.js";
import { API, graphqlOperation } from 'aws-amplify';
import { updateReview } from '../../../graphql/mutations';

const EditReviewModule = ({ setInputHasChanged, inputHasChanged, setDiscardModal, setDiscardType, setEditReviewError, setShowExitPrompt }) => {
    // hooks
    const params = useParams();
    const { userReviewsData, setUserReviewsData, currentReview, setCurrentReview } = useContext(DataContext)
    const navigate = useNavigate();
    const { auth } = useAuth();

    // state
    const [writeReviewModal, setWriteReviewModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true)
    const [dateValue, setDateValue] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [reviewContent, setReviewContent] = useState('');
    const [reviewTitle, setReviewTitle] = useState('');

    const [originalPrivateValue, setOriginalPrivateValue] = useState(false)
    const [originalReviewTitle, setOriginalReviewTitle] = useState('')
    const [originalReviewContent, setOriginalReviewContent] = useState('')
    const [originalDate, setOriginalDate] = useState('')


    useEffect(() => {
        // console.log("this is the review", review)
        if (currentReview?.title) {
            if (currentReview?.date !== "No Date") {
                setDateValue(currentReview.date)
                setStartDate(currentReview.date)
            } else {
                setDateValue('')
                setStartDate('')
            }
            
            setIsPrivate(currentReview.private)
    
            setReviewContent(currentReview.content)
            setReviewTitle(currentReview.title)

            setOriginalPrivateValue(currentReview.private)
            setOriginalDate(currentReview.date)
            setOriginalReviewContent(currentReview.content)
            setOriginalReviewTitle(currentReview.title)
            setIsLoading(false)
        }
    }, [currentReview])

    const checkPrivate = () => {
        if (isPrivate) {
            return "Visible only to you";
        } else {
            return "Visible to all";
        }
    }

    const onChange = () => {
        setInputHasChanged(true)
        setShowExitPrompt(true)
    }

    const onChangeDate = (date) => {

        // console.log("date", date)
        // we need this to always give us the user time zone date
        if (date) {
            setDateValue(date)
            setStartDate(date)
        } else {
            setDateValue(null)
            setStartDate(null)
        }
        onChange();
        // // console.log("prev date", date)

        // // this sets the time 7 hours ahead (if user is PST)
        // const newDate = formatUTC(date)

        // // console.log("formatUTC date", newDate)

        // // this subtracts 7 hours (if user is PST)
        // if (newDate) {
        //     const offset = date.getTimezoneOffset();
        //     let formattedDate = new Date(newDate.getTime() - (offset*60*1000))
        //     // this date is the same as newDate above
        //     // console.log("formatUTC offset date", formattedDate)
        //     setDateValue(formattedDate)
        //     setStartDate(date)

        //     // console.log("format", formattedDate)
        //     // console.log("date", date)
        //     onChange()
        // } else {
        //     setStartDate(null)
        //     setDateValue(null)
        // }
    }

    const onThoughtsClick = () => {
        setWriteReviewModal(true);
        onChange();
    }

    const slideAnimation = useTransition(writeReviewModal,  {
        from: {y: 1000},
        enter: {y: 0},
        leave: {y: 1000},
    });

    const saveReview = () => {
        // save data
        setWriteReviewModal(false)
    }

    const onTitleChange = (event) => {
        setReviewTitle(event.target.value);
        // console.log(reviewTitle);
        onChange()
    }

    const UpdateReview = async (event) => {
        event.preventDefault();

        if (!inputHasChanged) {
            // console.log("no changes made")
            navigate(`/${auth?.username}/feed/${params.id}`)
            return;
        }

        // console.log("update review")
        let data = {}
        data["id"] = currentReview.id

        if (originalReviewTitle !== reviewTitle) {
            // console.log("title is different")
            data["title"] = reviewTitle
        }

        if (originalDate !== dateValue) {
            // console.log("date is different")
            data["date"] = dateValue
            // console.log(dateValue)
        }
        if (originalReviewContent !== reviewContent) {
            // console.log("content is different")
            data["content"] = reviewContent
        }
        if (originalPrivateValue !== isPrivate) {
            // console.log("private is different")
            data["private"] = isPrivate
        }

        // if changes aren't different, return before patching
        if (Object.keys(data).length === 0) {
            // console.log("no changes to commit");
            return;
        }

        // set updated Time -  but only after checking that other changes
        // have been made
        data["updatedAt"] = new Date()

        try {
            const requestInfo = {
                response: true,
                body: data
            }

            const reviewData = await API.put('foodappreviewsapi', `/reviews/${auth.identityId}/${params?.id}`, requestInfo)
            const responseData = reviewData.data
            // console.log("updated review data", responseData)


            // update state with amended review data
            if (userReviewsData?.reviewData) {
                // update review and place back in user reviews data
                // console.log("user reviews data exists")
                const updatedState = userReviewsData.reviewData.map(review => {
                    if (review.review_id === responseData?.review_id) {
                        return {...review,
                        title: responseData?.title,
                        content: responseData?.content,
                        date: responseData?.date,
                        updatedAt_formatted: formatDate(responseData?.updatedAt),
                        date_formatted: formatDate(responseData?.date),
                        private: responseData?.private
                        }
                    }
                    return review;
                });
                updatedState.sort((a, b) =>  (a.date===null)-(b.date===null) || new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title))

                setUserReviewsData({
                    reviewData: updatedState,
                    username: auth?.username
                })
            } else {
                // no user data exists, just this reviews data
                // update review parts that are present in data
                setCurrentReview(prevState => ({
                    ...prevState,
                    "title": responseData?.title || currentReview.title,
                    "content": responseData?.content || currentReview.content,
                    "date": responseData?.date || currentReview.data,
                    "private": responseData?.private || currentReview.private,
                    "updatedAt_formatted": formatDate(responseData?.updatedAt) || formatDate(currentReview.updatedAt),
                    "date_formatted": formatDate(responseData?.date) || formatDate(currentReview.date)
                }))
            }

            CleanUpVariables();
            navigate(`/${auth?.username}/feed/${params.id}`)

        } catch (err) {
            // console.log(err);
            setEditReviewError(true)
        }
    }

    const CleanUpVariables = () => {
        setInputHasChanged(false)

        setDateValue('');
        setIsPrivate(false);
        setStartDate(null);
        setReviewContent('');
        setReviewTitle('');
    }

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


    const ClickToDelete = () => {
        setDiscardType("delete")
        setDiscardModal(true)
    }

    return (
        <>
        {!isLoading && 
            <DetailsContainer>
                <form onSubmit={UpdateReview}>
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
                            // locale="en-US"
                            dateFormat="MMM d, yyyy"
                            isClearable
                            placeholderText="enter date..."
                            calendarClassName="datepicker"
                        />
                        <InputTitle>My Thoughts</InputTitle>
                        <LargeInputText placeholder= "add review..." type="text" name="review" value={reviewContent} onClick={onThoughtsClick} readOnly="readOnly">
                        </LargeInputText>
                        <FieldDetailText>Last edited on {formatDate(currentReview?.updatedAt_formatted)}</FieldDetailText>
                        <InputTitle>Make Private?</InputTitle>
                        <SwitchContainer>
                            <ToggleSwitch label="label" isPrivate={isPrivate} setIsPrivate={setIsPrivate} setInputHasChanged={setInputHasChanged}/>
                        </SwitchContainer>
                        <VisibilityToggle>{checkPrivate()}</VisibilityToggle>
                        <br/>
                        <DeleteReview onClick={() => ClickToDelete()}>Delete this review</DeleteReview>
                        <br/><br/><br/><br/><br/><br/>
                    </InsideContainer>
                    {slideAnimation((style, item) => 
                        item ? <ContentContainer style={style}><ReviewContent saveReview={saveReview} setReview={setReviewContent} title={reviewTitle} editTitle={onTitleChange} review={reviewContent}></ReviewContent></ContentContainer> : ''
                    )}
                    </GridContainer>
                </form>
            </DetailsContainer>
        }
    </>
    );
};

export default EditReviewModule;