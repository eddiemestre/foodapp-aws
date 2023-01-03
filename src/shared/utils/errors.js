export const errors = {
      // confirmation code errors
      CodeMismatchException: "Invalid verification code provided, please try again.",
      resendConfirmationError: "Failed to send new code. Please use a different email or try again later",
      genericCodeFailure: "Code failed. Try again by resending the code.",
      ExpiredCodeException: "This code has expired. Try again by resending the code.",        
      
      // email errors
      emailTakenError: "An account with this email already exists, please use another.",
      invalidEmailEerror: "This email is invalid, please try again.",
      sameEmailAsCurrent: "Please provide an email that differs from Current Email.",
      genericEmailError: "There was an issue confirming your new email. Please use a different email or try again later.",
      
      // password errors
      oldPasswordNotValid: "The current password was incorrect, please try again.",
      invalidNewPassword: "Invalid password. Does your password match the criteria specified below?",
      passwordsNotSame: "Passwords do not match, please try again.",
      genericPasswordUpdateError: "Failed to update password. Please try again in a few minutes.",
      genericPasswordError: "Error setting password. Please ensure it matches the criteria.",
  
      // settings Errors
      invalidUsername: "Invalid username. A username should contain only letters and numbers and be 4 - 23 characters long.",
      nameLengthError: "Name must be less than 50 characters long.",
      genericError: "Failed to update user settings. Please try again.",
      noChangesError: "No changes to commit.",
      // Can't implement yet - for when users are associated with user tables
      usernameTaken: "Username already in use, please try another.", 

      // sign up errors
      genericSignUpError: "There was an issue creating your account, please try again later.",

      // login errors
    //   UserNotFoundException: "A user  with this email does not exist, please try again.", // not used
      NotAuthorizedException: "Incorrect username or password, please try again.",
      genericLoginFailedError: "Login failed, please try again.",

      // delete review error
      DeleteReviewError: "Unable to delete review, please try again.",

}