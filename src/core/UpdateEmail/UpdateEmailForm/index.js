import React, { useState, useEffect } from 'react';
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
import { Auth } from 'aws-amplify';
import useAuth from '../../../hooks/useAuth';
import { errors } from '../../../shared/utils/errors';
import { useExitPrompt } from '../../../hooks/useUnsavedChangesWarning';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,24}$/;


const EmailUpdateForm = ({ setUpdatedEmail, setConfirmationCodeAlert }) => {
    const [newEmail, setNewEmail] = useState('');
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

        // if email is same as current email, throw error
        if (newEmail.toLowerCase().trim() === auth.email) {
            setErrorMessages({name: emailError, message: errors.sameEmailAsCurrent})
            return;
        }

        // if email is already in use, throw error
        // This will attempt to confirm sign up with a fake code
        // when it fails, the NotAuthorizedException will be thrown
        //
        // Otherwise this will throw a UserNotFoundException exception
        // which should be ignored
        try {
            await Auth.confirmSignUp(newEmail.toLowerCase().trim(), "000000", {
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
              email: newEmail.toLowerCase().trim(),
            });
            // console.log("result update email", result)
            setrenderConfirmationCodeForm(true)
  
        } catch (err) {
            // console.log(err)
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
        const authCode = confirmationCode

        try {
            const result = await Auth.verifyCurrentUserAttributeSubmit('email', authCode);
            // console.log(result)
            setAuth(prevState => ({
                ...prevState,
                "email": newEmail,
              }))

            setUpdatedEmail(true)
            setNewEmail('')
            setConfirmationCode('')
            navigate(`/settings`)

        } catch (err) {
            // console.log(err)
            if (err.name === "CodeMismatchException") { // wrong code 
                setErrorMessages({name: codeError, message: errors.CodeMismatchException})
            } else if (err.name === "AliasExistsException") {   // user already exists
                setErrorMessages({name: emailError, message: errors.emailTakenError})    
            } else if (err.name === "ExpiredCodeException") {   // code expired
                setErrorMessages({ name: codeError, message: errors.ExpiredCodeException})    
            } else {    // generic
                setErrorMessages({name: codeError, message: errors.genericCodeFailure})
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
            const result = await Auth.updateUserAttributes(user, {
              email: newEmail.toLowerCase(),
            });
            // console.log(result)
            setConfirmationCodeAlert(true)
        } catch (err) {
            setErrorMessages({name: codeError, message: errors.resendConfirmationError})
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
                    <Exit onClick={() => navigate(`/settings`)}>Cancel</Exit>
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