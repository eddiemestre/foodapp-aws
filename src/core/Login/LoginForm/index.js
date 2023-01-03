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
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { Auth } from "aws-amplify";
import { errors } from "../../../shared/utils/errors";

const LoginForm = () => {
    const { setAuth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [errorMessages, setErrorMessages] = useState({});
    const [email, resetEmail, emailAttribs] =  useInput('email', '')
    const [password, setPassword] = useState('');
    const from = location.state?.from?.pathname || "/feed";

    // remove errors if user updates the email or password fields
    useEffect(() => {
      setErrorMessages({});
    }, [email, password])

    // login user
    // sents email and password to backend
    // sets  auth
    // clears password field
    // navigates to destination URL
    // throws errors if failure
    const PostLogin = async (event) => {
      // prevent page reload  
      event.preventDefault();

        // console.log("in post login")
        try {
            const user = await Auth.signIn(email.toLowerCase().trim(), password)
            // console.log("post login user", user)
            setAuth(
                {
                    name: user?.attributes?.name,
                    email: user?.attributes?.email,
                    username: user?.attributes.preferred_username
                }
            )
            setPassword('')
            navigate(from, { replace: true})
        } catch (err) {
          // console.log(err)
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
            <SubmitButton>Sign In</SubmitButton>
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