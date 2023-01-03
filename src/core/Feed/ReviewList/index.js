import React from "react";
import { ReviewContainer, AddText, MyReviews, TextContainer, UserReviewsTitle, ReviewFeedContainer } from './Styles'
import ReviewListModule from "./ReviewListModule/index.js";
// import { useParams } from "react-router-dom";

const ReviewList = ({reviews, anonUser, auth}) => {
    // const params = useParams();

    // when testing DB gets, see if an empty array suffices here
    // **************
    // **************
    const DisplayReviews = () => {
        // if (reviews) {
            if (reviews.length > 0) {
                return (
                    reviews.map(review => (
                        <ReviewListModule key={review.id} review={review}/>
                    ))
                )
            } else {
                return (
                    AddReviewText()
                )
            }
    }

    const AddReviewText = () => {
        if (auth.name) {
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
                {/* {auth?.username === params.username */}
                {auth?.username
                    ? <MyReviews>My Reviews</MyReviews>
                    : anonUser?.name
                        ? <MyReviews>{anonUser.name}'s Reviews</MyReviews>
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