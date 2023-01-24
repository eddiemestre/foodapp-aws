// testing functions for backend
import { Auth, API } from "aws-amplify";


/**
 * GUEST USER TESTS - DOES NOT REQUIRE VALID AUTHED USER
 * These tests execute on public API paths including:
 *      1) Public Reviews
 *      2) User signup
 *      3) User confirmation
 *      4) Getting Public User info
 * Note: It is suggested to run this function while not 
 * signed in to an existing account
 */
export const UnauthTests = () => {
    // list of tests

    // log test
    // LogTest();

    // REVIEWS
    // GetAllPublicReviews();
    // GetSinglePublicReview();
    // GetPrivateReviewAsGuest();
    // GetNonExistantReview();
    // GetNonExistantUsernameReview();

    // SIGN UP
    // SignUpUser();
    // SignUpWithExistingEmail();
    // SignUpWithExistingUsername();

    // ***need to be run in sequence with specific details***
    // IncorrectConfirmationCode();
    // CorrectConfirmationCode();
    // UserNameTakenDuringConfirmation();

    // USER DATA
    // PublicUserDataSuccess()
    // PublicUserDataUserNotFound()
    // PublicUserDataIncorrectURLOne()
    // PublicUserDataIncorrectURLTwo()
    
    

}

// test function
const LogTest = () => {
    console.log("this is a test")
}

// REVIEW BASED TESTS

// get all public reviews from user
const GetAllPublicReviews = async () => {
    const requestInfo = {
        response: true,
    }

    let username = 'eddie'
    try {
        const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${username}`, requestInfo)
        let reviews = reviewData.data

        for (let i = 0; i < reviews.length; i++) {
            if (reviews[i].private !== false) {
                throw new Error("Got private review on public review call.")
            }
        }
        console.log('✔ public review Data', reviews)
    } catch (err) {
        console.error('✖ ' + err.response)
    }
}

// get a single public review
const GetSinglePublicReview = async () => {
    const requestInfo = {
        response: true,
    }

    let username = 'eddie'
    let reviewID = '0dae0732-03aa-4d80-b9fb-301ce6af439c'
    try {
        const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${username}/${reviewID}`, requestInfo)
        let review = reviewData.data


        if (review.private !== false) {
            throw new Error("Got private review on public review call.")
        }
        
        console.log('✔ public review Data', review)
    } catch (err) {
        console.error('✖ ' + err.response)
    }
}

// try to get private review as guest
const GetPrivateReviewAsGuest = async () => {
    const requestInfo = {
        response: true,
    }

    let username = 'eddie'
    let reviewID = 'b5ad3985-e4b4-4de2-8b5e-0097e42a1550'
    try {
        const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${username}/${reviewID}`, requestInfo)
        let review = reviewData.data
        console.error('✖ managed to fetch private review as guest' + review)
    } catch (err) {
        console.log('✔ error fetching private review as guest', err.response)
    }
}

// try to get non-existant review
const GetNonExistantReview = async () => {
    const requestInfo = {
        response: true,
    }

    let username = 'eddie'
    let reviewID = '10000'
    try {
        const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${username}/${reviewID}`, requestInfo)
        let review = reviewData.data
        console.error('✖ managed to fetch a non-existant review' + review)
    } catch (err) {
        console.log('✔ error fetching non existant review as guest', err.response)
    }
}

// try to get non-existant user
const GetNonExistantUsernameReview = async () => {
    const requestInfo = {
        response: true,
    }

    let username = 'fakename'
    let reviewID = '10000'
    try {
        const reviewData = await API.get('foodappreviewsapi', `/publicreviews/${username}/${reviewID}`, requestInfo)
        let review = reviewData.data
        console.error('✖ managed to fetch a non-existant user\'s review' + review)
    } catch (err) {
        console.log('✔ error fetching non existant user\'s review', err.response)
    }
}

// SIGN UP BASED TESTS

// sign up new user
const SignUpUser = async (user_params=null) => {
    const requestInfo = {
        response: true,
        body: {
            name: user_params ? user_params.name : "lucy",
            username: user_params ? user_params.username : "lucy loo",
            email: user_params ? user_params.email : "egmest96@gmail.com",
            password: user_params ? user_params.password : 'hello!234'
        }
    }
  
    try {
        const user = await API.post('foodappsignupapi', '/signup', requestInfo)
        if (!user?.data?.UserSub) {
            throw new Error("No User sub found")
        }
        console.log('✔ signed up new user. Usersub:' + user?.data?.UserSub)
        return user?.data?.userSub
    } catch (err) {
        console.error('✖ error signing up user', err.response)
    }
}

// try to sign up user with existing email
const SignUpWithExistingEmail = async () => {
    const requestInfo = {
        response: true,
        body: {
            name: "lucy",
            username: "lucy loo",
            email: "eddie@eddiemestre.com",
            password: 'hello!234'
        }
    }
  
    try {
        const user = await API.post('foodappsignupapi', '/signup', requestInfo)
        if (!user?.data?.UserSub) {
            throw new Error("No User sub found")
        }
        console.error('✖ able to sign up user with existing email:' + user?.data?.UserSub)
    } catch (err) {
        console.log('✔ email already exists', err.response)
    }
}

// user with existing username
// MAKE SURE EMAIL IS NOT IN SYSTEM
const SignUpWithExistingUsername = async () => {
    const requestInfo = {
        response: true,
        body: {
            name: "lucy",
            username: "eddie",
            email: "eddie.mestre@mediamonks.com",
            password: 'hello!234'
        }
    }
  
    try {
        const user = await API.post('foodappsignupapi', '/signup', requestInfo)
        if (!user?.data?.UserSub) {
            throw new Error("No User sub found")
        }
        console.error('✖ able to sign up user with existing username:' + user?.data?.UserSub)
    } catch (err) {
        console.log('✔ username already exists', err.response)
    }
}

// incorrect confirmation code
const IncorrectConfirmationCode = async (user_params=null) => {
    const code = '000000'
    const usub = 'aa93cc7c-0cbf-4d64-9de1-1e02e9a1819f'
    const confirmationCode = user_params ? user_params.confirmationCode : code
    const username = user_params ? user_params.username : 'lucy loo'
    const email = user_params ? user_params.email : 'egmest96@gmail.com'
    const name = user_params ? user_params.name : 'lucy'
    const sub = user_params ? user_params.sub : usub

    const requestInfo = {
        response: true,
        body: {
          confirmationCode: confirmationCode,
          username: username,
          email: email,
          name: name,
          sub: sub
        }
    }

    try {
        const response = await API.post('foodappsignupconfirmationapi', '/signupconfirm', requestInfo);
        console.error('✖ able to sign up with incorrect confirmation code' + response)

    } catch (err) {
        console.log('✔ invalid confirmation code:', err.response)
    }
}

// correct confirmation code
const CorrectConfirmationCode = async (user_params=null) => {
    const code = '966394'
    const usub = '28ccbd59-876c-401d-9ecf-c5bdce302a80'
    const confirmationCode = user_params ? user_params.confirmationCode : code
    const username = user_params ? user_params.username : 'lucy loo'
    const email = user_params ? user_params.email : 'egmest96@gmail.com'
    const name = user_params ? user_params.name : 'lucy'
    const sub = user_params ? user_params.sub : usub

    const requestInfo = {
        response: true,
        body: {
          confirmationCode: confirmationCode,
          username: username,
          email: email,
          name: name,
          sub: sub
        }
    }

    try {
        await API.post('foodappsignupconfirmationapi', '/signupconfirm', requestInfo);
        console.log('✔ sign up confirmation successful')

    } catch (err) {
        console.error('✖ sign up confirmation unsuccessful', err.response)
        
        // only for testing double signups with same username
        // throw new Error("unable to sign up user")
    }
}

// another user takes username in between signup and confirmation
// Note: if testing this, be sure to uncomment the additional throw
// within the catch block of the CorrectConfirmationCode function above.
const UserNameTakenDuringConfirmation = async () => {
    
    try {
        // sign up user
        const userSub1 = await SignUpUser({
            name: "bee",
            email: "egmest96@gmail.com",
            username: "username",
            password: "hello!234",
        })

        // sign up another user with same username
        const userSub2 = await SignUpUser({
            name: "wasp",
            email: "applesftwxd@gmail.com",
            username: "username",
            password: "hello!234",
        })

        // confirm first user
        // await CorrectConfirmationCode({
        //     confirmationCode: '598429',
        //     username: 'username',
        //     email: 'egmest96@gmail.com',
        //     name: 'bee',
        //     sub: '6519b1ba-b20c-4a2e-af1e-80df191fc6bc'
        // })

        // // try to confirm second user
        // await CorrectConfirmationCode({
        //     confirmationCode: '077963',
        //     username: 'username',
        //     email: 'applesftwxd@gmail.com',
        //     name: 'wasp',
        //     sub: 'd2030cd9-b3b8-4f7d-b5b3-75ca756641cf'
        // })
        // console.error('✖ able to sign up a user with same username during confirmation')
    } catch (err) {
        console.log('✔ unable to signup another user with same username during confirmation')
    }   
}


// PUBLIC USER DATA TESTS

// successfully get public user reviews
const PublicUserDataSuccess = async () => {
    const requestInfo = {
        response: true,
    }

    let username = "john"
    
    try {
        const userInfo = await API.get('foodappusermethods', `/users/public/${username}`, requestInfo)
        console.log('✔ successfully retrieved public user Info', userInfo)

    } catch (err) {
        console.error('✖ unable to retrieve public user Info', err.response)
    }
}

// user doesn't exist
const PublicUserDataUserNotFound = async () => {
    const requestInfo = {
        response: true,
    }

    let username = "TTT"
    
    try {
        const userInfo = await API.get('foodappusermethods', `/users/public/${username}`, requestInfo)
        console.error('✖ able to get info of non-existant user', userInfo)
    } catch (err) {
        console.log('✔ unable to get data of non-existant user', err.response)
    }
}

// wrong URL 1
const PublicUserDataIncorrectURLOne = async () => {
    const requestInfo = {
        response: true,
    }

    let username = "john"
    
    try {
        const userInfo = await API.get('foodappusermethods', `/users/${username}`, requestInfo)
        console.error('✖ able to get info at wrong URL One', userInfo)
    } catch (err) {
        console.log('✔ unable to get data at wrong URL One', err.response)
    }
}

// wrong URL 2
const PublicUserDataIncorrectURLTwo = async () => {
    const requestInfo = {
        response: true,
    }

    let username = "john"
    
    try {
        const userInfo = await API.get('foodappusermethods', `/users/public/${username}/cheese`, requestInfo)
        console.error('✖ able to get info at wrong URL Two', userInfo)
    } catch (err) {
        console.log('✔ unable to get data at wrong URL Two', err.response)
    }
}




/**
 * AUTHED USER TESTS - REQUIRES A VALID SESSION TO EXECUTE
 * These tests rely on a valid identityID to execute on
 * the following API paths - 
 *      1) Private Reviews
 *      2) Private User Info
 *      3) Updating Name/Username
 *      4) Updating Email
 *      5) Updating Password
 */
export const AuthTests = (auth) => {
    if (!auth.identityId) {
        throw new Error("No identityID present")
    }

    ShowIdentityID(auth)
    // GetPrivatePublicReviews(auth)
    // GetPublicAuthedReview(auth)
    // GetPrivateAuthedReview(auth)
    // PostNewReview(auth)
    // UpdateReview(auth)
    // DeleteReview(auth)
    UpdateEmailSuccess(auth)
    // UpdateEmailWrongCode(auth)
    // EmailTaken()

    // user data
    // GetPublicDataAuthed()
    // GetPrivateUserData(auth)
    // GetOtherPrivateUserData()
    // ProxyTestUserData(auth)
    // UpdateName(auth)
    // UpdateUsername(auth)
    // UpdateNameAndUsername(auth)
    // UsernameTakenWriteName(auth)
    // UsernameTaken(auth)

}

// show identity ID
const ShowIdentityID = (auth) => {
    if (auth?.identityId) {
        console.log("auth identity ID: ", auth?.identityId)
    } else {
        console.error('✖ ' + "No identity ID present")
    }
}

// get private and public reviews
const GetPrivatePublicReviews = async (auth) => {

    const identity = await Auth.currentUserCredentials()

    console.log("identity id", identity?.identityId)
    const requestInfo = {
        response: true,
    }

    try {
        const reviewData = await API.get('foodappreviewsapi', `/reviews/${identity?.identityId}`, requestInfo)
        console.log('✔ private review Data', reviewData?.data)
    } catch (err) {
        console.log("err", err)
        console.error('✖ ' + err)
    }
}

// get public review while authed
const GetPublicAuthedReview = async (auth) => {
    const requestInfo = {
        response: true,
    }

    const reviewID = "528c1b03-02f2-469d-a402-121f6141b153"
    try {
        const reviewData = await API.get('foodappreviewsapi', `/reviews/${auth.identityId}/${reviewID}`, requestInfo)
        console.log("✔ authed public review Data", reviewData.data)
    } catch (err) {
        console.error('✖ ' + err.response)
    }
}

// get private review while authed
const GetPrivateAuthedReview = async (auth) => {
    const requestInfo = {
        response: true,
    }

    const reviewID = "b5ad3985-e4b4-4de2-8b5e-0097e42a1550"
    try {
        const reviewData = await API.get('foodappreviewsapi', `/reviews/${auth.identityId}/${reviewID}`, requestInfo)
        console.log("✔ authed private review Data", reviewData?.data)
    } catch (err) {
        console.error('✖ ' + err)
    }
}

// post a new review
const PostNewReview = async (auth) => {
    const requestInfo = {
        response: true,
        // queryStringParameters: {
        //     uniques_pk: `${params?.username}`,
        //     type_sk: "username"
        // }
        body: {
            title: "PostReviewTest",
            date: "Jan 1",
            content: "Post Review Test",
            private: true
        }
    }
    try {
        const reviewData = await API.post('foodappreviewsapi', `/reviews/${auth.identityId}`, requestInfo)
        console.log("✔ new review Data", reviewData.data)
    } catch (err) {
        console.error('✖ ' + err)
    }
}

// update a review
const UpdateReview = async (auth) => {
    const requestInfo = {
        response: true,
        // queryStringParameters: {
        //     uniques_pk: `${params?.username}`,
        //     type_sk: "username"
        // }
        body: {
            title: "UPDATE_TITLE_TEST",
            content: "UPDATE_TITLE_CONTENT",
        }
    }

    const reviewID = "d6b04e53-b7d8-4092-8278-69afae98b5a7"
    try {
        const reviewData = await API.put('foodappreviewsapi', `/reviews/${auth.identityId}/${reviewID}`, requestInfo)
        console.log("✔ updated review Data", reviewData.data)
    } catch (err) {
        console.error('✖ ' + err.response)
    }
}

// delete a review
const DeleteReview = async (auth) => {
    const requestInfo = {
        response: true
    }

    try {
        const reviewID = "22438522-870e-4332-810b-614f8e1a994a"
        const reviewData = await API.del('foodappreviewsapi', `/reviews/${auth.identityId}/${reviewID}`, requestInfo)
        console.log("✔ deleted review", reviewData.data)
    } catch (err) {
        console.error('✖ ' + err.response)
    }
}

// UPDATE EMAIL TESTS

// change email success
const UpdateEmailSuccess = async (auth) => {
    // Tries to update user email and send confirmation code to that new 
    // email. Throws a generic error if there is an issue at this point
    // since we know the email is unique.

    // define email to change to
    let email = "egmest96@gmail.com"

    // try updating the user attribute and getting confirmation code
    try {
        const user = await Auth.currentAuthenticatedUser();

        await Auth.updateUserAttributes(user, {
            email: email.toLowerCase().trim(),
        });
    } catch (err) {
        console.error('✖ ' + "error submitting new email", err.response)
    }

    // define confirmation code
    // let confirmationCode = "409715"

    // try {
    //     const user = await Auth.currentAuthenticatedUser();
    //     const requestInfo = {
    //         response: true,
    //         body: {
    //             accessToken: user.signInUserSession.accessToken.jwtToken,
    //             AttributeName: "Email address",
    //             Code: confirmationCode,
    //             newEmail: email.toLowerCase().trim()

    //         }
    //     }
    //     await API.put('foodappemailupdateapi', `/email/${auth.identityId}`, requestInfo)

    // } catch (err) {
    //     console.error('✖ ' + "error confirming and upating email", err.response)
    // }

    // try {
    //     // update session and user storage
    //     await Auth.currentSession({ bypassCache: true})
    //     const emailCheck = await Auth.currentAuthenticatedUser({ bypassCache: true});
    //     console.log("email check", emailCheck)
    //     if (emailCheck?.attributes?.email === email) {
    //         console.log('✔ updated email successfully')
    //     } else {
    //         console.error('✖ ' + "authenticated user email and updated email do not match")
    //     }
    // } catch (err) {
    //     console.error('✖ ' + "error getting current user email", err.response)
    // }
}

// change email wrong code
const UpdateEmailWrongCode = async (auth) => {
    // Tries to update user email and send confirmation code to that new 
    // email. Throws a generic error if there is an issue at this point
    // since we know the email is unique.

    // define email to change to
    let email = "applesftwxd@gmail.com"

    // try updating the user attribute and getting confirmation code
    try {
        const user = await Auth.currentAuthenticatedUser();

        await Auth.updateUserAttributes(user, {
            email: email.toLowerCase().trim(),
        });
    } catch (err) {
        console.error('✖ ' + "error submitting new email", err.response)
    }

    // define confirmation code
    let confirmationCode = "000000"

    // this should throw
    try {
        const user = await Auth.currentAuthenticatedUser();
        const requestInfo = {
            response: true,
            body: {
                accessToken: user.signInUserSession.accessToken.jwtToken,
                AttributeName: "Email address",
                Code: confirmationCode,
                newEmail: email.toLowerCase().trim()

            }
        }
        await API.put('foodappemailupdateapi', `/email/${auth.identityId}`, requestInfo)

        // if it doesn't, we have an error
        console.error('✖ ' + "able to confirm email with incorrect code!", user)
    } catch (err) {
        console.log('✔ unable to update email, confirmation code incorrect')
    }
}
// change email email taken
const EmailTaken = async (auth) => {
    // Tries to update user email and send confirmation code to that new 
    // email. Shouldn't be successful since email should be taken 

    // define email to change to
    let email = "egmest96@gmail.com"

    try {
        let response = await Auth.confirmSignUp(email.toLowerCase().trim(), "000000", {
            forceAliasCreation: false
        });
        console.error('✖ ' + "able to update non-unique email", response)
    } catch (err) {
        console.log('✔  unable to update email, email already exists!', err.response)
    }
}

// Get Public User Data while authed
const GetPublicDataAuthed = async () => {
    const requestInfo = {
        response: true,
    }

    let username = "johnny"
    
    try {
        const userInfo = await API.get('foodappusermethods', `/users/public/${username}`, requestInfo)
        console.log('✔ successfully retrieved public user Info', userInfo)

    } catch (err) {
        console.error('✖ unable to retrieve public user Info', err.response)
    }
}

// Get Private User Data
const GetPrivateUserData = async (auth) => {
    try {
        const requestInfo = {
            response: true,
        }

        // get user data
        const data = await API.get('foodappusermethods', `/users/private/${auth.identityId}`, requestInfo)
        console.log("✔ successfully retrieved private user data", data)
    } catch (err) {
        console.error('✖ ' + "Unable to retrieve private user data", err.response)
    }
}

// Try to get another user's private data
const GetOtherPrivateUserData = async () => {

    try {
        const requestInfo = {
            response: true,
        }

        // get user data
        const data = await API.get('foodappusermethods', `/users/private/eddie`, requestInfo)
        console.error("✖ got private data of another username", data)
    } catch (err) {
        console.log('✔ ' + "Unable to retrieve private user data of another user", err.response)
    }
}

// Additional path variables test
const ProxyTestUserData = async (auth) => {
    try {
        const requestInfo = {
            response: true,
        }

        // get user data
        const data = await API.get('foodappusermethods', `/users/private/${auth.identityId}/morestuff`, requestInfo)
        console.error("✖ able to get data with proxy info", data)
    } catch (err) {
        console.log('✔  ' + "Unable to retrieve private user data with proxy info", err.response)
    }
}

// Update Name
const UpdateName = async (auth) => {
    const requestInfo = {
        response: true,
        body: {
            name: "TEST"
        }
    }

    try {
        const response = await API.put('foodappusermethods', `/users/private/${auth.identityId}`, requestInfo)
        console.log('✔  ' + "successfully updated name", response)
    } catch (err) {
        console.error('✖ ' + "unable to update name with error", err.response)
    }
}

// Update Username
const UpdateUsername = async (auth) => {
    const requestInfo = {
        response: true,
        body: {
            username: "NEW TEST"
        }
    }

    try {
        const response = await API.put('foodappusermethods', `/users/private/${auth.identityId}`, requestInfo)
        console.log('✔  ' + "successfully updated username", response)
    } catch (err) {
        console.error('✖ ' + "unable to update username with error", err.response)
    }
}

const UpdateNameAndUsername = async (auth) => {
    const requestInfo = {
        response: true,
        body: {
            name: "NEW NEW",
            username: "NEW THREE"
        }
    }

    try {
        const response = await API.put('foodappusermethods', `/users/private/${auth.identityId}`, requestInfo)
        console.log('✔  ' + "successfully updated both username and name", response)
    } catch (err) {
        console.error('✖ ' + "unable to update both username and name with error", err.response)
    }
}

// Try to update username that's already taken along with name
// entire operation should fail since name is updated after username
const UsernameTakenWriteName = async (auth) => {
    const requestInfo = {
        response: true,
        body: {
            name: "Kew Kew",
            username: "NEW FOUR"
        }
    }

    try {
        const response = await API.put('foodappusermethods', `/users/private/${auth.identityId}`, requestInfo)
        console.error('✖ ' + "successfully update both username and name", response)

    } catch (err) {
        console.log('✔  ' + "unable to update both username and name", err.response)
    }
}

// Try to update username that's already taken
const UsernameTaken = async (auth) => {
    const requestInfo = {
        response: true,
        body: {
            username: "NEW FOUR"
        }
    }

    try {
        const response = await API.put('foodappusermethods', `/users/private/${auth.identityId}`, requestInfo)
        console.error('✖ ' + "able to update username despite it being taken", response)
    } catch (err) {
        console.log('✔  ' + "unable to update username that is already taken", err.response)
    }

}