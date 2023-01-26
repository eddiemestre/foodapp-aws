import React, { useState, useEffect, useContext } from "react";
import { App, 
  LogForm, 
  Title, 
  InputContainer, 
  Error, 
  ButtonContainer, 
  InputText, 
  SubmitButton, 
  ChoicesContainer, 
  Save,
  Exit,
  ChangeButton } from '../../../shared/components/FormStyles/Styles'
import { useNavigate } from "react-router-dom";
import PasswordValidator from "../../../shared/components/PasswordValidator/index.js";
import { API, Auth } from "aws-amplify";
import DataContext from "../../../shared/context/DataContext";
import { errors } from "../../../shared/utils/errors";

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,24}$/;

const SignUpForm = ( {setConfirmationCodeAlert, setErrorCreatingAccount }) => {
  // hooks
  const navigate = useNavigate();
  const { setJustSignedUp } = useContext(DataContext);

  const [showConfirmationCodeForm, setShowConfirmationCodeForm] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [errorMessages, setErrorMessages] = useState({});

  const [pass_one, setPassOne] = useState('');
  const [pass_two, setPassTwo] = useState('');

  const [isEightChar, setIsEightChar] = useState(false);
  const [hasNum, setHasNum] = useState(false);
  const [hasSym, setHasSym] = useState(false);
  const [isPassSame, setIsPassSame] = useState(false);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userSub, setUserSub] = useState('')
  
  // TO DO: add accessibility features for screen readers

  // NOT IMPLEMENTED: if a user just signed up but hasn't confirmed account
  // make sure the confirmation code page is shown instead of sign up.
  // Would need to include a "Cancel" CTA that checks if the email in
  // localstorage is verified. If it is, we just delete it, if it isn't
  // we delete the unverified account from the cognito user pool
  // useEffect(() => {
  //   if (localStorage.getItem("signup_email")) {
  //     setShowConfirmationCodeForm(true)
  //   }
  // }, [])


  const handleSubmit = async (event) => {
    //Prevent page reload
    event.preventDefault();
    
    // recheck validation
    const userCheck = USER_REGEX.test(username.trim());
    const passCheck = PASSWORD_REGEX.test(pass_one);
    const emailCheck = EMAIL_REGEX.test(email.toLowerCase().trim())

    // catch common registration errors before pinging backend
    if (!userCheck) {
      setErrorMessages({name: "invalidUsername", message: errors.invalidUsername});
      return;
    } else if (!emailCheck) {
      setErrorMessages({name: "invalidEmailEerror", message: errors.invalidEmailEerror})
      return;
    } else if (name.length > 50) {
      setErrorMessages({name: "nameLengthError", message: errors.nameLengthError})
      return;
    }

    // password checks
    if (!isEightChar || !hasSym || !hasNum || !passCheck) {   // invalid password characters 
      setErrorMessages({name: "invalidNewPassword", message: errors.invalidNewPassword})
      return;
    } else if (!isPassSame) {   // new passwords not the same
      setErrorMessages({name: "passwordsNotSame", message: errors.passwordsNotSame})
      return;
    }

    try {
      // console.log("send signup info to server")
      // define request parameters
      const requestInfo = {
        response: true,
        body: {
            name: name.trim(),
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: pass_one
        }
    }
      // try sending signup request
      // console.log("sending signup request")
      const user = await API.post('foodappsignupapi', '/signup', requestInfo)
      // console.log("user after signup", user)
      setUserSub(user?.data?.UserSub)

      // clear input fields, set state back to empty strings
      setPassOne('');
      setPassTwo('');
      setErrorMessages({})
      localStorage.setItem("signup_email", email)

      setShowConfirmationCodeForm(true)

    } catch (err) { // catch errors from backend
      // console.log("error sending signup request", err.response)
      if (err?.response?.data?.name === "UserNameExistsError") {
          setErrorMessages({name: "usernameTaken", message: errors.usernameTaken})
      } else if (err?.response?.data?.name === "EmailExistsError") {
        setErrorMessages({name: "emailTakenError", message: errors.emailTakenError}); 
      } else {  // other error
        setErrorMessages({name: "genericSignUpError", message: errors.genericSignUpError})
      }
    }
  };

  // runs once user enters a confirmation code
  const confirmAccount = async (event) => {
    //Prevent page reload
    event.preventDefault();

    // console.log("confirm account with confirmation code")

    // define request parameters
    const  requestInfo = {
      response: true,
      body: {
        confirmationCode: confirmationCode,
        username: username.trim(),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        sub: userSub
      }
    }

    try {
      // try to sent request to backend and get it confirmed
      const response = await API.post('foodappsignupconfirmationapi', '/signupconfirm', requestInfo);
      // console.log("confirm signup response:", response)

      // set just signed up to true so we display a message on the login page
      setJustSignedUp(true)
      
      // clear the state here
      setName('');
      setUsername('');

      // set the newly signed up email in local storage for convenience
      localStorage.setItem("email", email)
      localStorage.removeItem("signup_email")

      
      // navigate to login
      navigate(`/login`)
    } catch (err) {
      // console.log("error sending confirmation code request", err.response)
      if (err?.response?.data?.name === "UserNameExistsError") {
          setErrorMessages({name: "usernameTaken", message: errors.usernameTaken})
      } else if (err?.response?.data?.name === "EmailExistsError") {
        setErrorMessages({name: "emailTakenError", message: errors.emailTakenError}); 
      } else if (err?.response?.data?.name === "ForcedUnverificationError") {
        // special case where we need user to redo sign up, so set confirmation form to false
        setShowConfirmationCodeForm(false)
        setErrorCreatingAccount(true)
      } else if (err?.response?.data?.name === "CodeMismatchException") {
        setErrorMessages({name: "CodeMismatchException", message: errors.CodeMismatchException}); 
      } else if (err?.response?.data?.name === "ExpiredCodeException"){
        setErrorMessages({name: "ExpiredCodeException", message: errors.ExpiredCodeException});
      } else {  // other error
        setErrorMessages({name: "genericSignUpError", message: errors.genericSignUpError})
      }
    }
  }

  // Resend confirmation code
  // alerts user that confirmation code has been sent
  const ResendConfirmationCode = async () => {
    try {
        // just need email to make this work so doesn't need to be custom
        const result = await Auth.resendSignUp(email.toLowerCase().trim(), {
          email: email.toLowerCase().trim(),
        });
        // console.log(result)
        setConfirmationCodeAlert(true)
    } catch (err) {
      // console.log(err)
        setErrorMessages({name: "resendConfirmationError", message: errors.resendConfirmationError})
    }
  }

  // Generate JSX code for error message
  const renderErrorMessage = (name) =>
    name === errorMessages.name && (
      <Error>{errorMessages.message}</Error>
    );

// for password show/hide
    // const showHide = () => {
    //     const input = document.querySelector('password')
    //     showHide.addEventListener('click', ()=> {
    //         if (!isShown) {
    //             if (input.type === 'password') {
    //                 input.type = 'text';
    //                 isShown = true;
    //             }
    //         } else {
    //             input.type = 'password';
    //             isShown = false;
    //         }
    //     })
    // }

  // password one state
  const onChangeOne = (event) => {
      setPassOne(event.target.value);
      if (errorMessages) {
          setErrorMessages({})
      }
  }

  // password two state (confirm password)
  const onChangeTwo = (event) => {
      setPassTwo(event.target.value);
      if (errorMessages) {
        setErrorMessages({})
    }
  }

  // email state
  const onChangeEmail = (event) => {
      setEmail(event.target.value)
      if (errorMessages) {
        setErrorMessages({})
    }
  }

  // username state
  const onChangeUsername = (event) => {
    setUsername(event.target.value)
    if (errorMessages) {
      setErrorMessages({})
    }
  }

  // confirmation code state
  const onChangeConfirmationCode = (event) => {
    setConfirmationCode(event.target.value);
    if (errorMessages) {
        setErrorMessages({})
    }
  }
  
  // check for valid password
  useEffect(() => {
      // characters
      if (pass_one.length >= 8) {
          setIsEightChar(true);
      } else {
          setIsEightChar(false);
      }

      // numbers
      if (/[0-9]/.test(pass_one)) {
          setHasNum(true);
      } else {
          setHasNum(false);
      }

      // symbols
      if (/(?=.*[!@#$%^&*])/.test(pass_one)) {
          setHasSym(true);
      } else {
          setHasSym(false);
      }

      // match
      if (pass_one === pass_two && pass_one && pass_two) {
          setIsPassSame(true);
      } else {
          setIsPassSame(false);
      }


  }, [pass_one, pass_two, isEightChar, hasNum, hasSym, isPassSame]);

  // JSX code for login form
  const renderSignUpForm = (
    <div>
      <form onSubmit={handleSubmit}>
        <InputContainer>
          <InputText placeholder="name i.e. &quot;John&quot;..." type="text" name="name" autoComplete="on" onChange={(e) => setName(e.target.value)} required/>
          {renderErrorMessage("nameLengthError")}
        </InputContainer>
        <InputContainer>
          <InputText placeholder="username i.e. &quot;johnsmith89&quot;..." type="text" name="uname" autoComplete="on" onChange={onChangeUsername}required />
          {renderErrorMessage("invalidUsername")}
          {renderErrorMessage("usernameTaken")}
        </InputContainer>
        <InputContainer>
          <InputText placeholder="email..." type="text" name="email" autoComplete="on" onChange={onChangeEmail} required />
          {renderErrorMessage("invalidEmailEerror")}
          {renderErrorMessage("emailTakenError")}
        </InputContainer>
        <InputContainer>
          <InputText placeholder="password..." type="password" name="pass" autoComplete="new-password" value={pass_one} onChange={onChangeOne} required />
          {renderErrorMessage("invalidNewPassword")}
        </InputContainer>
        <InputContainer>
          <InputText placeholder="confirm password..." type="password" name="pass2" autoComplete="new-password" value={pass_two} onChange={onChangeTwo} required />
          {renderErrorMessage("passwordsNotSame")}
          {renderErrorMessage("genericSignUpError")}
        </InputContainer>
        <PasswordValidator pass_length_valid={isEightChar} pass_num_valid={hasNum} pass_sym_valid={hasSym} pass_same={isPassSame}></PasswordValidator>
        <ButtonContainer>
          <SubmitButton>Sign Up</SubmitButton>
        </ButtonContainer>
      </form>
    </div>
  );

  // renders the confirmation code form
  const renderConfirmationForm = (
      <div>
          <form onSubmit={confirmAccount}>
              <InputContainer>
                  <InputText placeholder="confirmation code..." type="text" name="confirmation code" autoComplete="on" onChange={onChangeConfirmationCode} required/>
                  {renderErrorMessage("CodeMismatchException")}
                  {renderErrorMessage("emailTakenError")}
                  {renderErrorMessage("ExpiredCodeException")}
                  {renderErrorMessage("genericCodeFailure")}
                  {renderErrorMessage("resendConfirmationError")}
                  {renderErrorMessage("genericSignUpError")}
              </InputContainer>
              <ChoicesContainer>
                  <Save><ChangeButton>Confirm</ChangeButton></Save>
                  <Exit onClick={() => ResendConfirmationCode()}>Resend Code</Exit>
              </ChoicesContainer>
          </form>
      </div>
  )
  
  return (
    <App>
        {!showConfirmationCodeForm && (
          <LogForm>
              <Title>Sign Up</Title>
              {renderSignUpForm}
          </LogForm>
      )
        }
      { showConfirmationCodeForm && (
          <LogForm>
              <Title>Confirm Account</Title>
              {renderConfirmationForm}
          </LogForm>
      )
      }
    </App>
  );
};
  

export default SignUpForm;