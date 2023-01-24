import React, {useEffect, useState, useContext } from "react";
import {GlobalStyle, GridContainer, NoticeContainer, NoticeText } from './Styles.js';
import ReviewList from "./ReviewList/index.js";
import { listReviews } from "../../graphql/queries.js";
import { Amplify, API, Auth, graphqlOperation } from "aws-amplify";
import DataContext from "../../shared/context/DataContext.js";
import { formatDate } from "../../shared/utils/FormatDate.js";
import { useParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import NotFound from "../../shared/components/NotFound/index";
// import awsmobile from "../../aws-exports.js";
// Amplify.configure(awsmobile)


const Feed = () => {
    const { userReviewsData, setUserReviewsData } = useContext(DataContext)
    const [isLoading, setIsLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const { auth } = useAuth();
    const params = useParams();
    const anonUser = {} // TODO: implement anonUser access

    useEffect(() => {
        setIsLoading(true)

        async function fetchUser() {
            try {
                // const user = await Auth.currentAuthenticatedUser()
                // console.log("user", user)

                // const token = user.signInUserSession.idToken.jwtToken
                // console.log("token", token)

                // console.log("sub", user.attributes.sub)
                // console.log("username", user.attributes.preferred_username)

                // if we get a 403 error, it is likely it won't be logged to 
                // cloudwatch because we don't have permission to access the 
                // lambda function or API gateway call in the first place. 

                // queryParameters - for Get, Scan, Query requests
                // body - for delete, put, post requests

                // Put - writing to the actual
                // user database will be handled in a 
                // lambda post confirmation trigger
                // upon user email verification.
                // Put - replace a resource
                // Post - use to create a new item

                // ************************************************
                // ************************************************
                // get user - this should be a higher level function
                // ************************************************
                // ************************************************
                // ************************************************

                // get user review data
                //
                //
                const requestInfo = {
                    // headers: { Authorization: token },
                    response: true,
                    // queryStringParameters: {
                    //     uniques_pk: `${params?.username}`,
                    //     type_sk: "username"
                    // }
                    // body: {
                    //     // title: "Medium?",
                    //     // date: "Small",
                    //     // content: "Small",
                    //     // private: false
                    // }
                }

                if (auth?.username === params.username) {
                    // get private and public reviews
                    // const reviewData = await API.get('foodappreviewsapi', `/reviews/${auth.identityId}/`, requestInfo)
                    // console.log("private review Data", reviewData)

                    // get single review
                    // const reviewID = "7cd0a4bb-778d-4c11-abd1-808a3363f48b"
                    // const reviewData = await API.get('foodappreviewsapi', `/reviews/${auth.identityId}/${reviewID}`, requestInfo)
                    // console.log("private review Data", reviewData)

                    // post a new review
                    // const reviewData = await API.post('foodappreviewsapi', `/reviews/${auth.identityId}/`, requestInfo)
                    // console.log("private review Data", reviewData)

                    // update review
                    // const reviewID = "d6b04e53-b7d8-4092-8278-69afae98b5a7"
                    // const reviewData = await API.put('foodappreviewsapi', `/reviews/${auth.identityId}/${reviewID}`, requestInfo)
                    // console.log("private review Data", reviewData)

                    // delete review
                    // const reviewID = "7cd0a4bb-778d-4c11-abd1-808a3363f48b"
                    // const reviewData = await API.del('foodappreviewsapi', `/reviews/${auth.identityId}/${reviewID}`, requestInfo)
                    // console.log("private review Data", reviewData)
                } else {
                    // Get all public reviews
                    // const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${params.username}`, requestInfo)
                    // console.log("public review data", reviewData)

                    // get single public review
                    // const reviewID = "347whswhh"
                    // const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${params.username}/${reviewID}`, requestInfo)
                    // console.log("public review data", reviewData)

                    // try to get private review
                    // const reviewID = "345675"
                    // const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${params.username}/${reviewID}`, requestInfo)
                    // console.log("public review data", reviewData)

                    // try to get nonexistant review
                    // const reviewID = "1000"
                    // const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${params.username}/${reviewID}`, requestInfo)
                    // console.log("public review data", reviewData)

                    // username doesn't exist
                    // const reviewID = "345675"
                    // const reviewData = await API.get('foodappreviewsapi', `/publicreviews/539/${reviewID}`, requestInfo)
                    // console.log("public review data", reviewData)
                }
                
                // const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${params.username}`, requestInfo)
                // console.log("public review data", reviewData)

   

                // us-west-2:e996d7ae-a1ea-4b12-ab26-4c92288926b3 - eddie@eddiemestre.com
                // const reviewData = await API.put('foodappreviewsapi', `/reviews/96d5debb-d328-4c40-af9e-4a494adecf11`, requestInfo)


                // const requestInfo = {
                //     // headers: { Authorization: token },
                //     response: true,
                //     queryStringParameters: {
                //         uniques_pk: `${params?.username}`,
                //         type_sk: "username"
                //     }
                // }
  
                // const data = await API.get('foodappusermethods', '/users', requestInfo)
                // // console.log(data)
                // let updatedData = JSON.parse(data?.data)
                // console.log("data", updatedData)
                // const data = await API.put('reactrestauthapi', '/users', requestInfo)

                // console.log("auth", auth)
                // Patch/Update
                // const requestInfo = {
                //     headers: { Authorization: token },
                //     response: true,
                //     body: {
                //         cognitoid: "post-test",
                //         username: "post123",
                //         email: "test@test.com",
                //         name: "Bach",
                //         verified: true
                //     }
                // }

                // const data = await API.patch('reactrestauthapi', '/users', requestInfo)

                // // Delete
                // const requestInfo = {
                //     headers: { Authorization: token },
                //     response: true,
                //     body: {
                //         cognitoid: "test-id",
                //         username: "test"
                //     }
                // }

                // const data = await API.del('reactrestauthapi', '/users', requestInfo)


                // Get, Query, Scan
                // Scan is not allowed (no queryStringParameters)
                // const requestInfo = {
                //     // headers: { Authorization: token },
                //     response: true,
                //     queryStringParameters: {
                //         uniques_pk: "eddie",
                //     }
                // }
        
                // const data = await API.get('foodappusermethods', '/users/', requestInfo)



                // Testing new API endpoint for Uniques
                // Get - should be public and private for reads
                // const requestInfo = {
                //     // headers: { Authorization: token },
                //     response: true,
                //     // queryStringParameters: {
                //     //     uniques_pk: 'eddie@eddiemestre.com',
                //     //     type_sk: 'email'
                //     // },
                //     body: {
                //         uniques_pk: 'eddie@eddiemestre.com',
                //         type_sk: 'email'
                //     }
                // }
        
                // const data = await API.get('reactrestauthapi', '/users', requestInfo)




                // console.log("data", data)
            } catch (err) {
                // console.log(err)
                console.log("error fetching user", err.response)
            }
        }
        // console.log("in this use effect")

        // fetchReviews
        // try to get reviews
        // sort and set user review state
        // if error, throw 404
        async function fetchReviews() {
            try {
                const response = await API.graphql(graphqlOperation(listReviews))
                const data = response.data.listReviews.items
                // console.log("listReviews", data)
                const updatedState = data.map(review => {
                    
                    return {...review,
                    updatedAt_formatted: formatDate(review?.updatedAt),
                    date_formatted: formatDate(review?.date)
                    }
                });

                // console.log("updated review state", updatedState)
                updatedState.sort((a, b) => (a.date===null)-(b.date===null) || new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title))

                setUserReviewsData(updatedState)
                setIsLoading(false)
            } catch (err) {
                // console.log("list reviews errors", err)
                setNotFound(true)
                setIsLoading(false)
            }
        }
        if (!userReviewsData) {
            // console.log("no user review data, retrieve!")
            fetchReviews()
            fetchUser()
        } else {
            setIsLoading(false)
        }
    }, [setUserReviewsData])

    return (
        <>
            <GlobalStyle />
            {!isLoading && !notFound &&
            <GridContainer >
                <ReviewList reviews={userReviewsData} auth={auth} anonUser={anonUser}/>
            </GridContainer>}
            {!isLoading && notFound &&
                <NotFound />
            }
        </>
    );
};

export default Feed;