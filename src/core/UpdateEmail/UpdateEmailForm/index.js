import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {Container,
    InputTitle, 
    InputText, 
    Error, 
    ChoicesContainer, 
    Save, 
    Exit, 
    ChangeButton
} from "./Styles";
import { InputContainer } from '../../../shared/components/FormStyles/Styles'
import { Auth, API } from 'aws-amplify';
import useAuth from '../../../hooks/useAuth';
import { errors } from '../../../shared/utils/errors';
import { useExitPrompt } from '../../../hooks/useUnsavedChangesWarning';
import DataContext from '../../../shared/context/DataContext';

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;


// email update form
const EmailUpdateForm = ({ setConfirmationCodeAlert }) => {
    const [newEmail, setNewEmail] = useState('');
    const [orEmail, setOrEmail] = useState('')
    const { setUpdatedEmail } = useContext(DataContext)
    const [renderConfirmationCodeForm, setrenderConfirmationCodeForm] = useState(false)
    const [confirmationCode, setConfirmationCode] = useState(null)
    const [errorMessages, setErrorMessages] = useState({});
    const navigate = useNavigate();
    const { auth, setAuth } = useAuth();
    const [showExitPrompt, setShowExitPrompt] = useExitPrompt()

    // for error handling
    const codeError = "codeError"
    const emailError = "emailError"
    
    // reset state of showExitPrompt to false when component
    // is unmounted
    useEffect(() => {
        return () => {
            setShowExitPrompt(false)
        }
    }, [])

    useEffect(() => {
        setOrEmail(auth?.email || '')
    }, [auth])

    // use effect for updated email field
    useEffect(() => {
        if (newEmail) {
            setShowExitPrompt(true)
        } else {
            // console.log("back to normal")
            setShowExitPrompt(false)
        }
    }, [newEmail])

    // handle Email Change
    // check that new email is not the same as the current email
    // ensure email is not already taken, if so throw exceptions
    // send a confirmation code to new email and show form for confirmation code
    // if errors, throw, otherwise set component state to default
    // and navigate back to settings
    const handleSubmit = async (event) => {
        event.preventDefault();
        // console.log("Submit email change")
        setNewEmail(newEmail.toLowerCase().trim())

        // if email is same as current email, throw error
        if (newEmail === auth.email) {
            setErrorMessages({name: emailError, message: errors.sameEmailAsCurrent})
            return;
        }

        const emailCheck = EMAIL_REGEX.test(newEmail);
        // if email is invalid, throw error
        if (!emailCheck) {
            setErrorMessages({name: "invalidEmailEerror", message: errors.invalidEmailEerror}); 
            setNewEmail(orEmail)
            return;
        }

        // if email is already in use, throw error
        // This will attempt to confirm sign up with a fake code
        // when it fails, the NotAuthorizedException will be thrown
        //
        // Otherwise this will throw a UserNotFoundException exception
        // which should be ignored
        try {
            await Auth.confirmSignUp(newEmail, "000000", {
                forceAliasCreation: false
            });
            return;
        } catch (err) {
            if (err.name === "NotAuthorizedException") {
                setErrorMessages({name: emailError, message: errors.emailTakenError})
                return;
            } 
            // else if (err.name === "UserNotFoundException") {
            //     console.log(err.name)
            // }
        }

        // Tries to update user email and send confirmation code to that new 
        // email. Throws a generic error if there is an issue at this point
        // since we know the email is unique.
        //
        // if successful, this changes the showConfirmationCode state to True to render
        // the confirmation code input field
        try {
            const user = await Auth.currentAuthenticatedUser();

            const result = await Auth.updateUserAttributes(user, {
              email: newEmail,
            });
            // console.log("result update email", result)

            if (errorMessages) {
                setErrorMessages({})
            }
            setrenderConfirmationCodeForm(true)
  
        } catch (err) {
            // console.log("error submitting new email", err)
            setErrorMessages({name: emailError, message: errors.genericEmailError})
        }
    }

    // confirms Account
    // tries  to verify new email the the user provided auth code. Updates the auth 
    // state with the new email and sets the updatedEmail state to true so that 
    // an alert is provided to the user informing them of the successful update.
    // navigates to the settings page once complete. 
    //
    // several errors can occur here that are captured in the catch clause. 
    const confirmAccount = async (event) => {
        //Prevent page reload
        event.preventDefault();
        // console.log("confirm account")

        try {
            const user = await Auth.currentAuthenticatedUser();
            // console.log("accessToken: ", user.signInUserSession.accessToken.jwtToken)
            
            const requestInfo = {
                response: true,
                body: {
                    accessToken: user.signInUserSession.accessToken.jwtToken,
                    AttributeName: "Email address",
                    Code: confirmationCode,
                    newEmail: newEmail
    
                }
            }
            const response = await await API.put('foodappemailupdateapi', `/email/${auth.identityId}`, requestInfo)            
            
            // console.log("update email response", response)
            
            setAuth(prevState => ({
                ...prevState,
                "email": newEmail,
              }))

            localStorage.setItem("email", newEmail)

            // update session and user storage
            await Auth.currentSession({ bypassCache: true})
            await Auth.currentAuthenticatedUser({ bypassCache: true});

            setUpdatedEmail(true)
            setNewEmail('')
            setConfirmationCode('')
            navigate(`/${auth?.username}/settings`)

        } catch (err) {
            let errName = err?.response?.data?.name
            // console.log("error confirming and upating email", err.response)
            // console.log("err name", errName)
            if (errName === "CodeMismatchException") { // wrong code 
                setErrorMessages({name: "CodeMismatchException", message: errors.CodeMismatchException})
            } else if (errName === "AliasExistsException") {   // user already exists
                setErrorMessages({name: emailError, message: errors.emailTakenError})    
            } else if (errName === "ExpiredCodeException") {   // code expired
                setErrorMessages({ name: codeError, message: errors.ExpiredCodeException})    
            } else {    // generic
                setErrorMessages({name: "genericCodeFailure", message: errors.genericCodeFailure})
            }
        }
    }

    const onChangeNewEmail = (event) => {
        setNewEmail(event.target.value);
        if (errorMessages) {
            setErrorMessages({})
        }
    }

    const onChangeConfirmationCode = (event) => {
        setConfirmationCode(event.target.value);
        if (errorMessages) {
            setErrorMessages({})
        }
    }
    
    // Resend confirmation code
    // alerts user that confirmation code has been sent
    const ResendConfirmationCode = async () => {
        try {
            const user = await Auth.currentAuthenticatedUser();
            await Auth.updateUserAttributes(user, {
              email: newEmail,
            });
            // console.log(result)
            setConfirmationCodeAlert(true)
        } catch (err) {
            setErrorMessages({name: "resendConfirmationError", message: errors.resendConfirmationError})
        }
    }

    // Generate JSX code for error message
    const renderErrorMessage = (name) =>
        name === errorMessages.name && (
            <Error>{errorMessages.message}</Error>
        );

    const renderEmailForm = (
        <div>
            <form onSubmit={handleSubmit}>
                <InputTitle>Current Email</InputTitle>
                <InputText value={auth?.email}  type="text" name="email" readOnly />
                <InputTitle>New Email</InputTitle>   
                <InputText placeholder="new email..." type="text" name="newEmail" value={newEmail} onChange={onChangeNewEmail} required />
                {renderErrorMessage(emailError)}
                <br />
                <br />
                <ChoicesContainer>
                    <Save><ChangeButton>Change Email</ChangeButton></Save>
                    <Exit onClick={() => navigate(`/${auth?.username}/settings`)}>Cancel</Exit>
                </ChoicesContainer>
            </form>
        </div>
    )

    const renderConfirmationForm = (
        <div>
            <form onSubmit={confirmAccount}>
                <InputContainer>
                    <InputTitle>Confirmation Code</InputTitle>
                    <InputText placeholder="enter confirmation code..." type="text" name="confirmation code" autoComplete="on" onChange={onChangeConfirmationCode} required/>
                    {renderErrorMessage(codeError)}
                    {renderErrorMessage(emailError)}
                    {renderErrorMessage("CodeMismatchException")}
                    {renderErrorMessage("AliasExistsException")}
                    {renderErrorMessage("ExpiredCodeException")}
                    {renderErrorMessage("resendConfirmationError")}
                </InputContainer>
                <ChoicesContainer>
                    <Save><ChangeButton>Confirm</ChangeButton></Save>
                    <Exit onClick={() => ResendConfirmationCode()}>Resend Code</Exit>
                </ChoicesContainer>
            </form>
        </div>
    )

    return (
        <Container>
            {!renderConfirmationCodeForm && renderEmailForm}
            {renderConfirmationCodeForm && renderConfirmationForm}
        </Container>
    )
}

export default EmailUpdateForm;