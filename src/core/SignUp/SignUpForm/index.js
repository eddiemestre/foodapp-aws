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
import { Auth } from "aws-amplify";
import DataContext from "../../../shared/context/DataContext";
import { errors } from "../../../shared/utils/errors";

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,24}$/;

// for error handling
const codeError = "codeError"

const SignUpForm = ( {setConfirmationCodeAlert }) => {
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
    
  // // TO DO: add accessibility features for screen readers

    const handleSubmit = async (event) => {
      //Prevent page reload
      event.preventDefault();
      
      // recheck validation
      const userCheck = USER_REGEX.test(username);
      const passCheck = PASSWORD_REGEX.test(pass_one);
      const emailCheck = EMAIL_REGEX.test(email.trim())

      // catch common registration errors before pinging backend
      if (!userCheck) {
        setErrorMessages({name: "invalidUsername", message: errors.invalidUsername});
        return;
      } else if (!emailCheck) {
        setErrorMessages({name: "invalidEmailEerror", message: errors.invalidEmailEerror})
        return
      } else if (name.length > 50) {
        setErrorMessages({name: "nameLengthError", message: errors.nameLengthError})
        return
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
        const { user } = await Auth.signUp({
            username: email.toLowerCase().trim(),
            password: pass_one,
            attributes: {
                preferred_username: username.toLowerCase(),
                name: name
            },
            autoSignIn: {
                enabled: true,
            }
        });
        // console.log("user after signup", user)

          // clear input fields, set state back to empty strings
          setName('');
          setUsername('');
          setPassOne('');
          setPassTwo('');
          setErrorMessages({})
          setShowConfirmationCodeForm(true)

      } catch (err) {

        // console.log(err)
        let errorName;

        // if this is the error, then this came from the 
        // Pre-Signup Lambda
        if (err.name === "UserLambdaValidationException") {
          errorName = err.message.split("error")[1]
          errorName = errorName.substring(0, errorName.length - 1).trim()
          // console.log("error", errorName)
        } else {
          errorName = err.name
        }

        if (errorName === "UsernameExistsException") { // Email must be unique
            setErrorMessages({name: "emailTakenError", message: errors.emailTakenError}); 
        } else if (errorName === "InvalidPasswordException") { // invalid password
            setErrorMessages({name: "invalidNewPassword", message: errors.invalidNewPassword})
        } else if (errorName === "UserNameExistsError") {  // from Pre-Signup Lambda
            setErrorMessages({name: "usernameTaken", message: errors.usernameTaken})
        } else if (errorName === "EmailExistsError") {  // from Pre-Signup Lambda
          setErrorMessages({name: "emailTakenError", message: errors.emailTakenError}); 
        } else {  // other error
            setErrorMessages({name: "genericSignUpError", message: errors.genericSignUpError})
        }
      }
    };

    const confirmAccount = async (event) => {
        //Prevent page reload
        event.preventDefault();
        // console.log("confirm account")
        const authCode = confirmationCode

        // console.log("email", lowerEmail)
        // console.log("authCode", authCode)

        try {
            await Auth.confirmSignUp(email.toLowerCase().trim(), authCode);
            setJustSignedUp(true)
            navigate(`/login`)
        } catch (err) {
            if (err.name === "CodeMismatchException") { // wrong code 
                setErrorMessages({name: err.name, message: err.message})
            } else if (err.name === "AliasExistsException") {   // user already exists
                setErrorMessages({name: "emailTaken", message: errors.emailTaken})    
            } else if (err.name === "ExpiredCodeException") {   // code expired
                setErrorMessages({ name: "ExpiredCodeException", message: errors.ExpiredCodeException})    
            } else if (err.name === "UserLambdaValidationException") {  // lambda Post Confirmation Error
                setErrorMessages({name: "genericSignUpError", message: errors.genericSignUpError})
            } else {    // generic
                setErrorMessages({name: "genericCodeFailure", message: errors.genericCodeFailure})
            }
        }
    }

    // Resend confirmation code
    // alerts user that confirmation code has been sent
    const ResendConfirmationCode = async () => {
      try {
          const result = await Auth.resendSignUp(email.toLowerCase().trim(), {
            email: email.toLowerCase().trim(),
          });
          // console.log(result)
          setConfirmationCodeAlert(true)
      } catch (err) {
        // console.log(err)
          setErrorMessages({name: codeError, message: errors.resendConfirmationError})
      }
    }

//     // Generate JSX code for error message
    const renderErrorMessage = (name) =>
      name === errorMessages.name && (
        <Error>{errorMessages.message}</Error>
      );

//     // for password show/hide
//     const showHide = () => {
//         const input = document.querySelector('password')
//         showHide.addEventListener('click', ()=> {
//             if (!isShown) {
//                 if (input.type === 'password') {
//                     input.type = 'text';
//                     isShown = true;
//                 }
//             } else {
//                 input.type = 'password';
//                 isShown = false;
//             }
//         })
//     }

    const onChangeOne = (event) => {
        setPassOne(event.target.value);
        if (errorMessages) {
            setErrorMessages({})
        }
    }

    const onChangeTwo = (event) => {
        setPassTwo(event.target.value);
        if (errorMessages) {
          setErrorMessages({})
      }
    }

    const onChangeEmail = (event) => {
        setEmail(event.target.value)
        if (errorMessages) {
          setErrorMessages({})
      }
    }

    const onChangeUsername = (event) => {
      setUsername(event.target.value)
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

    useEffect(() => {
        // console.log("confirmation code", confirmationCode)
    }, [confirmationCode])

  
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