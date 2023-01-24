import React, { useEffect, useState} from "react";
import { ReviewModule, ReviewTitle, ReviewDate, ReviewPreview } from './Styles.js';
import { useNavigate, useParams } from "react-router-dom";
import { formatDate } from "../../../../shared/utils/FormatDate.js";

const ReviewListModule = ({ review }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [formattedDate, setformattedDate] = useState(review.date || null)
    const [rerender, setRerender] = useState(false);
    const navigate = useNavigate();
    const params = useParams();


    useEffect(() => {
        if (formattedDate) {
            setformattedDate(formatDate(formattedDate))
        } else {
            setformattedDate('No Date')
        }
        setRerender(!rerender)  // dummy state
        setIsLoading(false)
    }, [])


    const handleClick = (event) => {
        // setFromReviewFeed(true)
        // navigate(`/user/${params.username}/${event}`)
        navigate(`/${params.username}/${event}`)
    }

    return(
        <>
        {!isLoading && 
            <ReviewModule onClick={() => handleClick(review.id)}>
                <ReviewTitle>
                    {review.title}
                </ReviewTitle>
                <ReviewDate>
                    {review.date_formatted}
                </ReviewDate>
                <ReviewPreview>
                    {review.content}
                </ReviewPreview>
            </ReviewModule>
        }
        </>
        
    );
}

export default ReviewListModule;