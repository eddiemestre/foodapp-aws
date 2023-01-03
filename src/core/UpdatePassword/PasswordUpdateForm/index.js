import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {Container, 
    InputTitle, 
    InputText, 
    Error, 
    ChoicesContainer, 
    Save, 
    Exit, 
    ChangeButton } from "./Styles";
import PasswordValidator from '../../../shared/components/PasswordValidator';
import { Auth } from 'aws-amplify';
import { errors } from '../../../shared/utils/errors';
import { useExitPrompt } from '../../../hooks/useUnsavedChangesWarning';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,24}$/;


const PasswordUpdate = ({ setUpdatedPassword }) => {
    const [oldPass, setOldPass] = useState('');
    const [passNew, setPassNew] = useState('');
    const [passNewConfirm, setPassNewConfirm] = useState('');
    const [errorMessages, setErrorMessages] = useState({});
    const [isEightChar, setIsEightChar] = useState(false);
    const [hasNum, setHasNum] = useState(false);
    const [hasSym, setHasSym] = useState(false);
    const [isPassSame, setIsPassSame] = useState(false);
    const [showExitPrompt, setShowExitPrompt] = useExitPrompt()

    const navigate = useNavigate();
    

    // reset state of showExitPrompt to false when component
    // is unmounted
    useEffect(() => {
        return () => {
            setShowExitPrompt(false)
        }
    }, [])

    // use effect for updated fields field
    useEffect(() => {
        if (oldPass || passNew || passNewConfirm) {
            console.log('changed')
            setShowExitPrompt(true)
        } else {
            console.log("back to normal")
            setShowExitPrompt(false)
        }
    }, [oldPass, passNew, passNewConfirm])

    const handleSubmit = async (event) => {
        event.preventDefault();
        // console.log("Submit password change")
        // const passCheck = PASSWORD_REGEX.test(passNew);

        // check password Validator settings
        // if any of these are not true, then do not continue with function and
        // throw an error
        if (!isEightChar || !hasSym || !hasNum) {   // invalid password characters 
            setErrorMessages({name: "invalidNewPassword", message: errors.invalidNewPassword})
            return;
        } else if (!isPassSame) {   // new passwords not the same
            setErrorMessages({name: "passwordsNotSame", message: errors.passwordsNotSame})
            return;
        }

        // update the password
        // set component state back to default
        // set updated password alert to true
        // navigate back to settings
        // throw errors if updating password fails on the backend
        try {
            const user = await Auth.currentAuthenticatedUser()
            const response = await Auth.changePassword(user, oldPass, passNew)
            // console.log(response)

            // clear input fields, set state back to empty strings
            setOldPass('');
            setPassNew('');
            setPassNewConfirm('');

            // sset update Password alert to true and navigate back to settings
            setUpdatedPassword(true)
            navigate('/settings')
        } catch (err) {
            // console.log(err)
            // if the current password is not valid, notify user that their old
            // password was entered incorrectly
            if (err.name === "NotAuthorizedException") {
                setErrorMessages({name: "oldPasswordNotValid", message: errors.oldPasswordNotValid})
            } else { // else throw a generic error to capture other exceptions
                setErrorMessages({name: "genericPasswordUpdateError", message: errors.genericPasswordUpdateError})
            }
        }
    }

    // Update new password state
    const onChangeNew = (event) => {
        setPassNew(event.target.value);
        if (errorMessages) {
            setErrorMessages({})
        }
    }

    // update the new password confirmation state
    const onChangeNewConfirm = (event) => {
        setPassNewConfirm(event.target.value);
        if (errorMessages) {
            setErrorMessages({})
        }
    }

    // update the old password state
    const onChangeOld = (event) => {
        setOldPass(event.target.value);
        if (errorMessages) {
            setErrorMessages({})
        }
    }
    
    // Generate JSX code for error message
    const renderErrorMessage = (name) =>
        name === errorMessages.name && (
            <Error>{errorMessages.message}</Error>
        );

    // check for valid password
    useEffect(() => {
        // characters
        if (passNew.length >= 8) {
            setIsEightChar(true);
        } else {
            setIsEightChar(false);
        }

        // numbers
        if (/[0-9]/.test(passNew)) {
            setHasNum(true);
        } else {
            setHasNum(false);
        }

        // symbols
        if (/(?=.*[!@#$%^&*])/.test(passNew)) {
            setHasSym(true);
        } else {
            setHasSym(false);
        }

        // match
        if (passNew === passNewConfirm && passNew && passNewConfirm) {
            setIsPassSame(true);
        } else {
            setIsPassSame(false);
        }
    }, [passNew, passNewConfirm, isEightChar, hasNum, hasSym, isPassSame]);

    return (
        <Container>
        <form onSubmit={handleSubmit}>
                <InputTitle>Current Password</InputTitle>
                <InputText placeholder="enter current password..." type="password" name="pass" autoComplete="new-password" value={oldPass} onChange={onChangeOld} required />
                {renderErrorMessage("oldPasswordNotValid")}  
                <InputTitle>New Pasword</InputTitle>   
                <InputText placeholder="new password..." type="password" name="pass" autoComplete="new-password" value={passNew} onChange={onChangeNew} required />
                {renderErrorMessage("invalidNewPassword")}  
                <InputTitle>Confirm New Pasword</InputTitle> 
                <InputText placeholder="confirm password..." type="password" name="pass2" autoComplete="new-password" value={passNewConfirm} onChange={onChangeNewConfirm} required />
                {renderErrorMessage("passwordsNotSame")}
                {renderErrorMessage("genericPasswordUpdateError")}
                <PasswordValidator pass_length_valid={isEightChar} pass_num_valid={hasNum} pass_sym_valid={hasSym} pass_same={isPassSame}></PasswordValidator>
                <br />
                <ChoicesContainer>
                    <Save><ChangeButton>Change Password</ChangeButton></Save>
                    <Exit onClick={() => navigate(`/settings`)}>Cancel</Exit>
                </ChoicesContainer>
        </form>
        </Container>
    )
}

export default PasswordUpdate;