import React, {useEffect, useState, useContext } from "react";
import {GlobalStyle, GridContainer, NoticeContainer, NoticeText } from './Styles.js';
import ReviewList from "./ReviewList/index.js";
import { listReviews } from "../../graphql/queries.js";
import { Amplify, API, Auth, graphqlOperation } from "aws-amplify";
import DataContext from "../../shared/context/DataContext.js";
import { formatDate } from "../../shared/utils/FormatDate.js";
// import { useParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import NotFound from "../../shared/components/NotFound/index";
// import awsmobile from "../../aws-exports.js";
// Amplify.configure(awsmobile)


const Feed = () => {
    const { userReviewsData, setUserReviewsData } = useContext(DataContext)
    const [isLoading, setIsLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const { auth } = useAuth();
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
                // const requestInfo = {
                //     // headers: { Authorization: token },
                //     response: true,
                //     body: {
                //         uniques_pk: "eddie",
                //         type: "username"
                //     }
                // }

                // const data = await API.put('lambdaapitest', '/users', requestInfo)
                // const data = await API.put('reactrestauthapi', '/users', requestInfo)


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
        
                // const data = await API.get('lambdaapitest', '/users/', requestInfo)



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
                console.log(err)
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