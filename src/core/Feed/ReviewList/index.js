import React from "react";
import { ReviewContainer, AddText, MyReviews, TextContainer, UserReviewsTitle, ReviewFeedContainer } from './Styles'
import ReviewListModule from "./ReviewListModule/index.js";
import { useParams } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

const ReviewList = ({reviews, currentPageUser}) => {
    const { auth } = useAuth();
    const params = useParams();

    const DisplayReviews = () => {
        if (reviews.length > 0) {
            return (
                reviews.map(review => (
                    <ReviewListModule key={review.review_id} review={review}/>
                ))
            )
        } else {
            return (
                AddReviewText()
            )
        }
    }

    const AddReviewText = () => {
        if (auth?.name === currentPageUser?.name) {
            return (
                <TextContainer><AddText>Add your first review by<br/>clicking the + icon below!</AddText></TextContainer>
            )
        } else {
            return (
                <TextContainer><AddText>Looks like this user doesn't<br/>have any public reviews.</AddText></TextContainer>
            )
        }
    }


    return (
        <ReviewContainer>
            <UserReviewsTitle>
                {auth?.username === currentPageUser?.username
                    ? <MyReviews>My Reviews</MyReviews>
                    : currentPageUser?.name
                        ? <MyReviews>{currentPageUser.name}'s Reviews</MyReviews>
                        : <MyReviews></MyReviews>
                }
            </UserReviewsTitle>
            <ReviewFeedContainer>
                {DisplayReviews()} 
            </ReviewFeedContainer>     
        </ReviewContainer>
    );
};

export default ReviewList;