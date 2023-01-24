const AWS = require('aws-sdk')

/** 
 * Lambda function for signing up a new user. 
 */ 

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

/**
 *  Function: Main
 *  Params:
 *      event - contains all request details
 *  Purpose: Defines variables needed to process request
 *  Returns: an object containing the response and statusCode
 */
exports.handler = async (event) => {
    console.log("in sign up lambda")
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // variables
    let responseBody = {}
    let statusCode = 400
    let userIsUnique = false  // default to false

    // parse request body params
    parsedEvent = JSON.parse(event.body)
    console.log("parsedEvent", parsedEvent)

    /**
     *  Check Uniques Table to ensure values are not already used
     *  CheckUniquesTable returns true if the user signing up
     *  has unique data and false if they do not
     */
    try {
      console.log("try checking uniques table for existing user")
      userIsUnique = await CheckUniquesTable(parsedEvent)
      console.log("The user data is unique?", userIsUnique)
    } catch (err) {
      console.log(`Error checking table: ${err}`)
      responseBody.message = err.message
      responseBody.name = err.code
      statusCode = err.statusCode
    }

    if (userIsUnique) {
      // If user is unique, try adding user to userpool
      try {
        console.log("try signing up user")
        const res = await SignUpUser(parsedEvent);
        responseBody = res
        statusCode = 200
      } catch (err) {
        console.log("sign up error:", err)
        responseBody.message = err.message
        responseBody.name = err.code
        statusCode = err.statusCode
      }
    }

    // set response
    let response = {
      statusCode: statusCode,
    //  Uncomment below to enable CORS requests
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      }, 
        body: JSON.stringify(responseBody),
    }
    
    console.log("Final response", response)
    return response
};

/**
 *  Function: CheckUniquesTable
 *  Params: 
 *      user_attributes - email and username for new user
 *  Purpose: Checks that the email and username are not currently in use
 *  Returns: True if unique or throws an error
 */
const CheckUniquesTable = async (user_attributes) => {
    console.log("in CheckUniquesTable")
    const docClient = new AWS.DynamoDB.DocumentClient()
    
    // define variable
    let response;
  
    // requests two sets of keys to retrieve from db
    let params = {
      RequestItems: {
        "Uniques": {
          "Keys": [
            {
              "uniques_pk": `${user_attributes.username}`,
              "type_sk": "username"
            },
            {
              "uniques_pk": `${user_attributes.email}`,
              "type_sk": "email"
            }
          ]
        }
      }
    }
  
    // debugging
    console.log("params for docClient: ", params)
  
    /**
     * try to get the items from the uniques table
     * if nothing is returned, the user is unique
     * otherwise, we have a match and the user is not unique
     */
    try {
      response = await docClient.batchGet(params).promise()
      console.log("checked uniques. Data found:", response)
    } catch (err) {
      console.log("Error while checking uniques", err)
      throw new Error(err)
    }
  
    // if the response is not an empty array, we have a match
    if (response.Responses.Uniques.length) {
      console.log("uniques data exists", response.Responses.Uniques)
      // grab first non-unique value and use it as the error
      if (response.Responses.Uniques[0].type_sk === "username") {
        // username exists, throw error
        throw new Error({
          message: "This username already exists, please try another.",
          code: "UserNameExistsError",
          statusCode: 400
        })
      } else if (response.Responses.Uniques[0].type_sk === "email") {
        // email exists, throw error
        throw new Error({
          message: "This email is already in use, please try another.",
          code: "EmailExistsError",
          statusCode: 400
        })
      } else {
        // another error occurred, throw generic error
        throw new Error({
          message: "There was a problem creating your account, please try again.",
          code: "UnknownError",
          statusCode: 400
        })
      }
    }
  
    return true
  }

/**
 *  Function: SignUpUser
 *  Params: 
 *      parsedEvent - email and password for new user
 *  Purpose: Tries to sign up the new user to the defined user pool
 *  Returns: an object containing the response and statusCode
 */
const SignUpUser = async (parsedEvent) => {
  console.log("in sign up user.")
  // get cognito service provider
  let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  // define variable
  let response;

  // set user pool data (this is retrieved from console)
  const poolData = {
    UserPoolId: "us-west-2_xppYTNPHq",
    AppClientId: "37ar0fs228co0246khbhkbu9sc"
  }

  // define params to signup the user
  const params = {
    ClientId: `${poolData.AppClientId}`,
    Password: `${parsedEvent.password}`,
    Username: `${parsedEvent.email}`,   // username should be an email
  }

  // try signing up user
  try {
    console.log("trying to sign up user")
    response = await cognitoidentityserviceprovider.signUp(params).promise();
    console.log("successfully signed up user", response)
  } catch (err) {
    console.log("sign up error:", err)
    throw new Error(err)
  }

  return response;
}

// Error handling custom class
class Error {
  constructor(message) {
      this.message = message.message
      this.code = message.code
      this.statusCode = message.statusCode
  }
}
