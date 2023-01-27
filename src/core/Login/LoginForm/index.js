import React, {useEffect, useState } from "react";
import { App, 
        LogForm, 
        Title, 
        InputContainer, 
        Error, 
        ButtonContainer, 
        InputText, 
        SubmitButton, 
        NoAccount } from '../../../shared/components/FormStyles/Styles'

import useInput from "./PersistInput";
import { BeatLoader } from "react-spinners";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { Auth, API } from "aws-amplify";
import { errors } from "../../../shared/utils/errors";

const LoginForm = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessages, setErrorMessages] = useState({});
  const [email, resetEmail, emailAttribs] =  useInput('email', '')
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false)
  let from = location.state?.from?.pathname || null;

  // remove errors if user updates the email or password fields
  useEffect(() => {
    setErrorMessages({});
  }, [email, password])

  // if other local storage data exists, remove it - cognito clutter
  useEffect(() => {
    const tempEmail = localStorage.getItem('email') || null
    localStorage.clear()
    if (tempEmail) {
      localStorage.setItem("email", tempEmail)
    }
  }, [])

  /**
   * login user
   * sents email and password to backend
   * sets auth
   * clears password field
   * navigates to destination URL
   * throws errors if failure
   */
  const PostLogin = async (event) => {
    // prevent page reload  
    event.preventDefault();
    setIsLoading(true)

      // console.log("in post login")
      try {
        // get authed user credentials
        const user = await Auth.signIn(email.toLowerCase().trim(), password)
        console.log("post login user", user)

        // get identity data
        const identity = await Auth.currentUserCredentials()
        const data = await API.get('foodappusermethods', `/users/private/${identity.identityId}`, {response: true})

        // debugging
        // console.log("user identity data", identity)
        // console.log("user data", data)
        
        // temp var for userAttributes
        let userAttributes = data?.data
        // console.log("user attributes", userAttributes)

        // set auth state
        setAuth(
            {
                name: userAttributes?.name,
                email: userAttributes?.email,
                username: userAttributes?.username,
                identityId: identity.identityId
            }
        )

        // clear password form
        setPassword('')
        
        // if we are coming from somewhere, go there
        // otherwise go to feed
        if (!from) {
          // console.log("reassign from")
          from = `/${userAttributes?.username}/feed`
        }
        setIsLoading(false)
        navigate(from, { replace: true})
      } catch (err) {
        console.log("error signing in user", err)
        // keep sign in errors generic
        if (err.name === "NotAuthorizedException") {
          setErrorMessages({name: "NotAuthorizedException", message: errors.NotAuthorizedException})
        } else {
          setErrorMessages({name: "genericLoginFailedError", message: errors.genericLoginFailedError})
        } 
      }
    }

  // Generate JSX code for error message
  const renderErrorMessage = (name) => {
    if (name === errorMessages.name) {
      return(<Error>{errorMessages.message}</Error>);
    }
  }


//     // JSX code for login form
  const renderForm = (
    <div>
      <form onSubmit={PostLogin}>
        <InputContainer>
          <InputText 
              placeholder="email..." 
              type="text"
              name="email" 
              autoComplete="email"
              {...emailAttribs}
              required />
        </InputContainer>
        <InputContainer>
          <InputText 
              placeholder="password..." 
              type="password" 
              name="pass" 
              value={password} 
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)} 
              required />
          {renderErrorMessage("genericLoginFailedError")}
          {renderErrorMessage("NotAuthorizedException")}
          
        </InputContainer>
        <NoAccount>Don't have an account? Sign up <Link to="/signup">here.</Link></NoAccount>
        <ButtonContainer>
          <SubmitButton>
            { isLoading
              ? <BeatLoader
                  color="black"
                  size={8}
                  loading={isLoading}
                />
              : "Sign In"
            }
            </SubmitButton>
        </ButtonContainer>
      </form>
    </div>
  );

  return (
    <App>
      <LogForm>
        <Title>Log In</Title>
        {renderForm}
      </LogForm>
    </App>
  );
}
  

export default LoginForm;