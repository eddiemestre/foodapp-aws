import { createContext, useEffect, useState, useContext } from 'react';
import DataContext from './DataContext';
import { useParams } from "react-router-dom";
import { API, graphqlOperation } from 'aws-amplify';
import { getReview } from '../../graphql/queries';
import { formatDate } from '../utils/FormatDate';

const SingleReviewContext = createContext({});

export const ReviewProvider = ({ children }) => {
    const [notFound, setNotFound] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { userReviewsData, currentReview, setCurrentReview } = useContext(DataContext)
    const params = useParams()

    useEffect(() => {
        // console.log("reviews", reviews)
        setIsLoading(true)

        // fetch single review
        // grab review based off URL
        // format Date data and set current review
        // throw errors if there are issues
        async function fetchSingleReview() {
          // console.log("fetch single review if it exists")
          try {
            const response = await API.graphql(graphqlOperation(getReview, {id:(params.id).toString()}))
            const data = response.data.getReview

          //   console.log("data with date", data)

            // if data does not exist, set 404, otherwise format the date data
            if (!data) {
              // console.log("no results found")
              setNotFound(true)
            } else {
              data["updatedAt_formatted"] = formatDate(data.updatedAt)
              data["date_formatted"] = formatDate(data.date)
              setCurrentReview(data)
            }
            // console.log(data)
            setIsLoading(false)
          } catch (err) {
            // console.log(err)
            setNotFound(true)
            setIsLoading(false)
          }
        }
  
        // if there is  userReviewData, we know we've come from the feed and the review with this
        // id exists.
        if (userReviewsData) {
            // console.log("user review data exists")
            setCurrentReview(userReviewsData.find(review => (review.id).toString() === params.id))
            setIsLoading(false)
        } else {
          // if there is no current review or the current review id does not match the URL, fetch a single review
          if (!currentReview || currentReview.id !== params.id) {
            // console.log("current review doesn't exist")
            fetchSingleReview()
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