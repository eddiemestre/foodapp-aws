import { createContext, useState } from 'react';

const DataContext = createContext({});

export const DataProvider = ({ children }) => {
    //  data
    const [userReviewsData, setUserReviewsData] = useState(null) // set
    const [currentReview, setCurrentReview] = useState(null) // set
    // state
    const [updatedSettings, setUpdatedSettings] = useState(false) // set
    const [updatedPassword, setUpdatedPassword] = useState(false) // set
    const [updatedEmail, setUpdatedEmail] = useState(false) // set
    const [justSignedUp, setJustSignedUp] = useState(false) // set

    // const [fromReviewFeed, setFromReviewFeed] = useState(false)
    
    return (
        <DataContext.Provider value={{ 
            userReviewsData, setUserReviewsData,
            currentReview, setCurrentReview,
            updatedSettings, setUpdatedSettings,
            updatedPassword, setUpdatedPassword,
            updatedEmail, setUpdatedEmail,
            justSignedUp, setJustSignedUp,
                // fromReviewFeed, setFromReviewFeed
        }}>
            { children }
        </DataContext.Provider>
    )
}

export default DataContext;