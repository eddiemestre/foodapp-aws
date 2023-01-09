import React, {useEffect, useState, useContext } from "react";
import {GlobalStyle, GridContainer, NoticeContainer, NoticeText } from './Styles.js';
import ReviewList from "./ReviewList/index.js";
import { listReviews } from "../../graphql/queries.js";
import { Amplify, API, graphqlOperation } from "aws-amplify";
import DataContext from "../../shared/context/DataContext.js";
import { formatDate } from "../../shared/utils/FormatDate.js";
// import { useParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import NotFound from "../../shared/components/NotFound/index";
import awsmobile from "../../aws-exports.js";
Amplify.configure(awsmobile)


const Feed = () => {
    const { userReviewsData, setUserReviewsData } = useContext(DataContext)
    const [isLoading, setIsLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const { auth } = useAuth();
    const anonUser = {} // TODO: implement anonUser access

    useEffect(() => {
        setIsLoading(true)
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