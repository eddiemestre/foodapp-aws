import React, {useEffect, useState, useContext } from "react";
import {GlobalStyle, GridContainer} from './Styles.js';
import ReviewList from "./ReviewList/index.js";
import { API } from "aws-amplify";
import DataContext from "../../shared/context/DataContext.js";
import { formatDate } from "../../shared/utils/FormatDate.js";
import { useParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import NotFound from "../../shared/components/NotFound/index";

// get all reviews
const Feed = () => {
    const { userReviewsData, setUserReviewsData, currentPageUser, setCurrentPageUser } = useContext(DataContext)
    const [isLoading, setIsLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const { auth } = useAuth();
    const params = useParams();

    useEffect(() => {
        setIsLoading(true)

        async function fetchUser() {
            // get current page user
            if (auth?.username === params?.username) {
                setCurrentPageUser(() => ({
                    username: auth?.username,
                    name: auth?.name
                }))
            } else {
                try {
                    // console.log("trying to get public user data")
                    const userInfo = await API.get('foodappusermethods', `/users/public/${params?.username}`, {response: true})
                    // console.log("successfully got user data:", userInfo?.data)
                    setCurrentPageUser({
                        username: userInfo?.data?.username,
                        name: userInfo?.data?.name
                    })
                } catch (err) {
                    // console.log(err)
                    setNotFound(true)
                    setIsLoading(false)
                    return;
                }
            }
        }

        // fetchReviews
        // try to get reviews
        // sort and set user review state
        // if error, throw 404
        async function fetchReviews() {
            let reviews;
            if (auth?.username === params.username) {
                try {
                    // get user review data
                    const reviewData = await API.get('foodappreviewsapi', `/reviews/${auth.identityId}`, {response: true})
                    // console.log("private review Data", reviewData)
                    reviews = reviewData?.data
                } catch (err) {
                    // console.log("error fetching user review data 1", err)
                    // console.log("error fetching user review data 2", err.response)
                    setNotFound(true)
                    setIsLoading(false)
                    return;
                }
            } else {
                try {
                    // Get all public reviews
                    const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${params.username}`,  {response: true})
                    // console.log("public review data", reviewData)
                    reviews = reviewData?.data
                } catch (err) {
                    // console.log("error fetching public user review data 1", err)
                    // console.log("error fetching public user review data 2", err.response)
                    setNotFound(true)
                    setIsLoading(false)
                    return;
                }
            }

            // console.log("reviews before formatting: ", reviews)
            const updatedState = reviews.map(review => {
                return {...review,
                updatedAt_formatted: formatDate(review?.updatedAt),
                date_formatted: formatDate(review?.date)
            }
            });

            // sort reviews? 
            updatedState.sort((a, b) =>  (a.date===null)-(b.date===null) || new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title))

            // console.log("updated review state", updatedState)

            setUserReviewsData({
                reviewData: updatedState,
                username: params.username
            })
            setIsLoading(false)
        }
      
        // fetchReviews and user data
        // if our current review and user data matches the path parameters,
        // we are good to go
        if (userReviewsData?.username === params.username && currentPageUser?.username === params.username) {
            // console.log("userReview data exists and matches URL")
            setIsLoading(false)
            // we need to fetch reviews and potentially user data
        } else {
            // if parameters don't match auth, fetch user data
            // console.log("userReview data doesnt exist or doesn't match URL")
            fetchUser()
            fetchReviews()
        }
        
    }, [setUserReviewsData, params])


    return (
        <>
            <GlobalStyle />
            {!isLoading && !notFound &&
            <GridContainer >
                <ReviewList reviews={userReviewsData?.reviewData} currentPageUser={currentPageUser}/>
            </GridContainer>}
            {!isLoading && notFound &&
                <NotFound />
            }
        </>
    );
};

export default Feed;