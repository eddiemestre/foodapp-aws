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
import { Auth, API } from "aws-amplify";
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

    // useEffect(() => {
    //   const tempEmail = localStorage?.email || null
    //   localStorage.clear()
    //   if (tempEmail) {
    //     localStorage.setItem("email", tempEmail)
    //   }
    // }, [])

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
            // get authed user credentials
            const user = await Auth.signIn(email.toLowerCase().trim(), password)
            console.log("post login user", user)

            // get user data
            const requestInfo = {
                response: true,
                queryStringParameters: {
                    uniques_pk: `${user?.attributes?.email}`,
                    type_sk: 'email'
                },
            }
    
            const data = await API.get('lambdaapitest', '/users', requestInfo)

            console.log("in login fetch user data", data)

            setAuth(
                {
                    name: data?.data?.name,
                    email: user?.attributes?.email,
                    username: data?.data?.username
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