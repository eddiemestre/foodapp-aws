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
                const user = await Auth.currentAuthenticatedUser()
                console.log("user", user)

                const token = user.signInUserSession.idToken.jwtToken
                console.log("token", token)

                // console.log("sub", user.attributes.sub)
                // console.log("username", user.attributes.preferred_username)

                // Put - writing to the actual
                // user database will be handled in a 
                // lambda post confirmation trigger
                // upon user email verification.
                // Put - replace a resource
                // Post - use to create a new item
                const requestInfo = {
                    headers: { Authorization: token },
                    response: true,
                    body: {
                        cognitoid: "post-test",
                        username: "post123",
                        name: "ms. lucy",
                        verified: false
                    }
                }

                const data = await API.post('reactrestauthapi', '/hello', requestInfo)
                // const data = await API.put('reactrestauthapi', '/hello', requestInfo)


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

                // const data = await API.patch('reactrestauthapi', '/hello', requestInfo)

                // // Delete
                // const requestInfo = {
                //     headers: { Authorization: token },
                //     response: true,
                //     body: {
                //         cognitoid: "test-id",
                //         username: "test"
                //     }
                // }

                // const data = await API.del('reactrestauthapi', '/hello', requestInfo)


                // Get, Query, Scan
                // const requestInfo = {
                //     headers: { Authorization: token },
                //     response: true,
                //     queryStringParameters: {
                //         cognitoid: user.attributes.sub,
                //         username: user.attributes.preferred_username
                //     }
                // }
        
                // const data = await API.get('reactrestauthapi', '/hello', requestInfo)



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
        
                // const data = await API.get('reactrestauthapi', '/hello', requestInfo)




                console.log("data", data)
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