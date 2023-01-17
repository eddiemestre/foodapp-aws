import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {Container, 
        InputTitle, 
        InputText, 
        Error, 
        ChoicesContainer, 
        Save, 
        Exit, 
        ReadOnlyText, 
        SvgArrow, 
        ReadOnlyContainer,
        SaveButton } from "./Styles";
import useAuth from '../../../hooks/useAuth';
import { Auth, API } from 'aws-amplify';
import DataContext from '../../../shared/context/DataContext';
import { errors } from '../../../shared/utils/errors';
import { useExitPrompt } from '../../../hooks/useUnsavedChangesWarning';

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;


const SettingsForm = () => {
    // hooks
    const { auth, setAuth } = useAuth();
    const navigate = useNavigate();
    const { setUpdatedSettings } = useContext(DataContext);
    const [showExitPrompt, setShowExitPrompt] = useExitPrompt()

    // state
    const [errorMessages, setErrorMessages] = useState({});
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [orName, setOrName] = useState('');
    const [orUsername, setOrUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true)
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // set state
    useEffect(() => {
        setIsLoading(true)
        // console.log("in settings form use effect", auth)
        setName(auth?.name || '')
        setUsername(auth?.username || '')
        setOrName(auth?.name || '')
        setOrUsername(auth?.username || '')
        if (auth?.name) {
            setIsLoading(false)
        }
    }, [auth])

    // reset state of showExitPrompt to false when component
    // is unmounted
    useEffect(() => {
        return () => {
            setShowExitPrompt(false)
        }
    }, [])

    // use effect that compares username and name values
    // and sets the exit prompt hook if a change has been 
    // made
    useEffect(() => {
        if (orName !== name || orUsername !== username) {
            // console.log("different")
            setShowExitPrompt(true)
        } else {
            // console.log("back to normal")
            setShowExitPrompt(false)
        }
    }, [name, username])

    // an error Expiration function
    // when called it delays setting errors to empty for 
    // 5 seconds
    const errorExpiration = async () => {
        await delay(5000);
        setErrorMessages({})
    };

    useEffect(() => {
        // if no changes to commit, expire the error
        if (errorMessages.name === "noChangesError") {
            errorExpiration()
        }
    }, [errorMessages])
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        // console.log("Submit settings change")

        const userCheck = USER_REGEX.test(username);
        // const emailCheck = EMAIL_REGEX.test(email);

        // if username is invalid, throw error
        if (!userCheck) {
            setErrorMessages({name: "invalidUsername", message: errors.invalidUsername}); 
            setUsername(orUsername)
            return;
        }
        // if name is invalid, throw error
        if (name.length >= 50) {
            setErrorMessages({name: "nameLengthError", message: errors.nameLengthError})
            setName(orName)
            return;
        }
        // if no changes to commit, throw error
        if (name === orName && username === orUsername) {
            setErrorMessages({name: "noChangesError", message: errors.noChangesError})
            return;
        }

        // create a data object to capture updates to the 
        // name and username. This object will be sent to the backend
        // let data = {}

        // if (orName !== name) {
        //     data['name'] = name
        // }
        // if (orUsername !== username) {
        //     data['preferred_username'] = username
        // }

        // updates user attributes
        // sets updated auth state
        // sets settings change alert to true
        // throws error if there is an issue
        try {
            // console.log("send response to graphQL")
            // TODO:
            // check if username is unique
            const requestInfo = {
                response: true,
                body: {
                    name: name !== orName ? `${name}` : null,
                    username: username !== orUsername ? `${username}` : null
                }
            }

            const response = await API.put('lambdaapitest', '/users', requestInfo)
    
            // const user = await Auth.currentAuthenticatedUser();
            // const response = await Auth.updateUserAttributes(user, data);
            console.log("update user settings", response)

            console.log("username:", response?.data?.username)
            // update auth state
            setAuth(prevState => ({
                ...prevState,
                "username": response?.data?.username || orUsername,
                "name": response?.data?.name || orName
              }))

            // set updated settings alert
            setUpdatedSettings(true)

        } catch (err) {
            console.log(err)
            // TODO:
            // will eventually check that username is unique. For now
            // throws a generic error if something goes wrong
            setErrorMessages({name: "genericError", message: errors.genericError})
        }
    }

    const OnNameChange = (event) => {
        setName(event.target.value)
        if (errorMessages) {
            setErrorMessages({})
        }
    }

    const OnUsernameChange = (event) => {
        setUsername(event.target.value)
        if (errorMessages) {
            setErrorMessages({})
        }
    }

    // Generate JSX code for error message
    const renderErrorMessage = (name) =>
        name === errorMessages.name && (
            <Error>{errorMessages.message}</Error>
        );

    const RightArrow = (
        <SvgArrow
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            fill="none"
            viewBox="0 0 30 30"
        >
            <path
                fill="#fff"
                d="M10.737 20.738L16.462 15l-5.725-5.738L12.5 7.5 20 15l-7.5 7.5-1.763-1.762z"
            ></path>
        </SvgArrow>
    )

    const Components = (
        <Container>
        <form onSubmit={handleSubmit}>
                <InputTitle>Full Name</InputTitle>
                <InputText placeholder="name i.e. &quot;John&quot;..." value={name} type="text" name="name" onChange={(e) => OnNameChange(e)} />
                {renderErrorMessage("nameLengthError")}
                <InputTitle>Username</InputTitle>
                <InputText placeholder="username i.e. &quot;johnsmith89&quot;..." value={username} type="text" name="uname" onChange={(e) => OnUsernameChange(e)} />
                {renderErrorMessage("invalidUsername")}
                {renderErrorMessage("usernameTaken")}
                <InputTitle>Email</InputTitle>
                <ReadOnlyContainer onClick={() => navigate(`/update-email/`)}>
                    <ReadOnlyText value={auth.email} type="text" name="email" readOnly />
                    {RightArrow}
                </ReadOnlyContainer>
                <InputTitle>Password</InputTitle>
                <ReadOnlyContainer onClick={() => navigate(`/update-password/`)}>
                    <ReadOnlyText value="change password" type="text" readOnly />
                    {RightArrow}
                </ReadOnlyContainer>
                {renderErrorMessage("noChangesError")}
                {renderErrorMessage("genericError")}
                <br />
                <ChoicesContainer>
                    <Save><SaveButton>Save</SaveButton></Save>
                    <Exit onClick={() => navigate(`/feed`)}>Exit</Exit>
                </ChoicesContainer>
        </form>
        </Container>
    )

    return (
        <>
            {!isLoading && Components}
        </>
    )
}

export default SettingsForm;