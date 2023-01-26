import { createContext, useEffect, useState, useContext } from 'react';
import DataContext from './DataContext';
import { useParams } from "react-router-dom";
import { API } from 'aws-amplify';
import { formatDate } from '../utils/FormatDate';
import useAuth from '../../hooks/useAuth';

const SingleReviewContext = createContext({});

export const ReviewProvider = ({ children }) => {
    const [notFound, setNotFound] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { userReviewsData, currentReview, setCurrentReview, currentPageUser, setCurrentPageUser } = useContext(DataContext)
    const params = useParams()
    const { auth } = useAuth();

    useEffect(() => {
      setIsLoading(true)

      // fetch user data
      async function fetchUser() {
        // get current page user
        if (auth?.username === params.username) {
            setCurrentPageUser(() => ({
                username: auth?.username,
                name: auth?.name
            }))
        } else {
            try {
                // console.log("trying to get public user data")
                const userInfo = await API.get('foodappusermethods', `/users/public/${params.username}`, {response: true})
                // console.log("successfully got user data:", userInfo?.data)
                setCurrentPageUser(() => ({
                    username: userInfo?.data.username,
                    name: userInfo?.data.name
                }))
            } catch (err) {
                // console.log(err)
                setNotFound(true)
                setIsLoading(false)
                return;
            }
          }
      }

      // fetch single review
      // grab review based off URL
      // format Date data and set current review
      // throw errors if there are issues
      async function fetchSingleReview() {
        // console.log("fetch single review")
        let review;
        if (auth?.username === params.username) {
          // console.log("is authed review")
            try {
                // get user review data
                const reviewData = await API.get('foodappreviewsapi', `/reviews/${auth.identityId}/${params.id}`, {response: true})
                // console.log("got review", reviewData.data)
                review = reviewData?.data
            } catch (err) {
                // console.log("error fetching user review data 1", err)
                // console.log("error fetching user review data 2", err.response)
                setNotFound(true)
                setIsLoading(false)
                return;
            }
        } else {
          // console.log("is other review")
            try {
                // Get all public review
                const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${params?.username}/${params?.id}`, {response: true})
                // console.log("public review data", reviewData)
                review = reviewData?.data
            } catch (err) {
                // console.log("error fetching public user review data 1", err)
                // console.log("error fetching public user review data 2", err.response)
                setNotFound(true)
                setIsLoading(false)
                return;
            }
        }

        // console.log("review before formatting: ", review)
        const updatedState = {
          ...review,
          updatedAt_formatted: formatDate(review?.updatedAt),
          date_formatted: formatDate(review?.date)
        }
        // console.log("updated review state", updatedState)

        setCurrentReview(updatedState)
        setIsLoading(false)
    }
  
        // if there is  userReviewData, we know we've come from the feed and the review with this
        // id exists.
        if (userReviewsData && currentPageUser.username === params.username) {
            // console.log("user review data exists")
            setCurrentReview(userReviewsData?.reviewData.find(review => review.review_id === params.id))
            setIsLoading(false)
        } else {
          // if there is no current review or the current review id does not match the URL, fetch a single review
          if (!currentReview || currentReview.id !== params.id) {
            // console.log("current review doesn't exist")
            fetchSingleReview()
            fetchUser()
          } else {
            setIsLoading(false)
          }
        }
      }, [userReviewsData, setCurrentReview, setIsLoading, setNotFound, params])

    return (
        <SingleReviewContext.Provider value={{ 
            notFound, setNotFound, isLoading, setIsLoading
        }}>
            {children}
        </SingleReviewContext.Provider>
    )
}

export default SingleReviewContext;