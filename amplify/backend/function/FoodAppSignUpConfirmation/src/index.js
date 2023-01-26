const AWS = require('aws-sdk')

/** 
 * Lambda function for confirming user signup.
 */ 

/**
 * The following errors are possible:
 * Request Details Incorrect:
 *    MissingCredentialsError
 * 
 * Uniques Failed:
 *    Misc/UnknownError - throw generic error on frontend
 *    UserNameExistsError
 *    EmailExistsError
 * 
 * ConfirmSignUp Failed:
 *    Generic - throw generic error on frontend
 * 
 * AddDataToTables Failed:
 *    Generic - throw generic error on frontend
 * 
 * DeleteUser
 *    ForcedUnverificationError - show this if AddToDataTables failed
 *    Generic - would require a Log check - this should be highly unusual
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
  console.log("in post confirmation lambda")
  console.log(`EVENT: ${JSON.stringify(event)}`);

  let responseBody = {}
  let statusCode = 400
  let userIsUnique = false;         // default
  let successConfirmingUser = false // default
  let successPopulatingTables = false;    // defualt

  // parse request body params
  let parsedEvent = JSON.parse(event.body)
  console.log("parsedEvent", parsedEvent)

  // if all elements exist to create a user, check uniques again
  if (parsedEvent?.name && parsedEvent?.username && parsedEvent?.sub && parsedEvent?.email) {
    // check uniques
    try {
      console.log("check that user data is unique")
      userIsUnique = await CheckUniquesTable(parsedEvent);
      console.log("User data is unique?", userIsUnique)
    } catch (err) {
      responseBody.message = err.message
      responseBody.name = err.code
      statusCode = err.statusCode
    }
  } else {
    console.log(`Error: Missing parameters necessary to create account: ${parsedEvent}`)
    responseBody.message = "Missing info needed to create account, please try again."
    responseBody.name = "MissingCredentialsError"
    statusCode = 400
  }

  // if user is unique, try confirming account
  if (userIsUnique) {
    try {
      console.log("try confirming user")
      successConfirmingUser = await ConfirmUserSignUp(parsedEvent)
      console.log("success confirming user with response", successConfirmingUser)
    } catch (err) {
      console.log("issue confirming user", err)
      responseBody.message = err.message
      responseBody.name = err.code
      statusCode = err.statusCode
    }
  }

  // if we successfully confirmed user, add user data to tables
  if (successConfirmingUser) {
    try {
      console.log("try adding user to table")
      successPopulatingTables = await AddUserDataToTables(parsedEvent)
      console.log("success adding user with response", successPopulatingTables)
      responseBody = "Successfully added user."
      statusCode = 200;
    } catch (err) {
      console.log("error adding user to database after confirmation.", err)
      responseBody.message = err.message
      responseBody.name = err.code
      statusCode = err.statusCode
    }
  }

  /**
   * if successPopulatingTables is false, there was an error
   * adding the user to the database. We'll need to manually
   * delete the user and have them re-do signup.
   */
  if (!userIsUnique || (successConfirmingUser && !successPopulatingTables)) {
    try {
      console.log("deleting user")
      await DeleteUser(parsedEvent);
      console.log("success deleting user.")

      // unique instance where we want to throw a 400 on success
      responseBody.message = "Unable to verify user, please try again."
      responseBody.name = "ForcedUnverificationError"
      statusCode = 400
    } catch (err) {
      console.log("error deleting user.", err)
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
  };

  console.log("final response", response)
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
 *  Function: AddUserDataToTables
 *  Params:
 *      user_attributes - contains all new user details
 *  Purpose: Adds user to the Users and Uniques tables via BatchWrite
 *  Returns: True if user is added successfully, or an error
 */
const AddUserDataToTables = async (user_attributes) => {
  console.log("in Add To User Table")
  const docClient = new AWS.DynamoDB.DocumentClient()
  
  // define response variables
  let response;
  let userAdded = false // default

  // define the batchWrite parameters
  let params = {
    RequestItems: {
      "Users": [
        {
          PutRequest: {
            // check not exists for user sub
            ConditionExpression: "attribute_not_exists(#id)",
            ExpressionAttributeNames: {
              "#id": "id"
            },
            // the attributes we're adding to the table
            Item: {
              id: `${user_attributes.sub}`,
              name: `${user_attributes.name}`,
              username: `${user_attributes.username}`,
              email: `${user_attributes.email}`,
              verified: true
            }
          }
        }
      ],
      "Uniques": [
        {
          PutRequest: {
            // check not exists for username
            ConditionExpression: "attribute_not_exists(#u)",
            ExpressionAttributeNames: {
              "#u": "uniques_pk"
            },
            // attributes we're adding to the table
            Item: {
              uniques_pk: `${user_attributes.username}`,
              type_sk: "username",
              id: `${user_attributes.sub}`
            }
          }
        },
        {
          PutRequest: {
            // check not exists for email
            ConditionExpression: "attribute_not_exists(#u)",
            ExpressionAttributeNames: {
              "#u": "uniques_pk"
            },
            Item: {
              uniques_pk: `${user_attributes.email}`,
              type_sk: "email",
              id: `${user_attributes.sub}`
            }
          }
        }
      ]
    }
  }

  // debugging
  console.log("params for docClient: ", params)

  // try writing rows to tables
  try {
    console.log("trying to write user to tables")
    response = await docClient.batchWrite(params).promise()
    console.log("success adding user to both databases", response)
    userAdded = true
  } catch (err) {
    console.log("Error adding new user", err)
    throw new Error(err)
  }

  return userAdded
}

/**
 *  Function: ConfirmUserSignUp
 *  Params:
 *      parsedEvent - contains confirmation code and email
 *  Purpose: Verifies user in user pool allowing user to sign in
 *  Returns: True if account is confirmed or an error
 */
const ConfirmUserSignUp = async (parsedEvent) => {
  // define indentity provider
  let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  // define user pool data (retrieved from console)
  const poolData = {
    UserPoolId: "us-west-2_xppYTNPHq",
    AppClientId: "37ar0fs228co0246khbhkbu9sc"
  }

  // define parameters for sign up confirmation
  const params = {
    ClientId: `${poolData.AppClientId}`,
    ConfirmationCode: `${parsedEvent.confirmationCode}`,
    Username: `${parsedEvent.email}`,   // username should be an email
  }

  // try confirming account
  try {
    const data = await cognitoidentityserviceprovider.confirmSignUp(params).promise();
    console.log("successfully signed up user", data)
  } catch (err) {
    console.log("sign up error:", err)
    throw new Error(err)
  }

  return true
}

/**
 *  Function: DeleteUser
 *  Params:
 *      parsedEvent - contains username
 *  Purpose: Deletes user from user pool
 *  Returns: Nothing or an error
 */
const DeleteUser = async (parsedEvent) => {
  console.log("in delete user")
  let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  // define user pool data (retrieved from console)
  const poolData = {
    UserPoolId: "us-west-2_xppYTNPHq",
    AppClientId: "37ar0fs228co0246khbhkbu9sc"
  }

  // define parameters for deletion
  const params = {
    UserPoolId: `${poolData.UserPoolId}`,
    Username: `${parsedEvent.email}`,   // username should be an email
  }

  // try deleting account
  try {
    console.log("try deleting user")
    const data = await cognitoidentityserviceprovider.adminDeleteUser(params).promise();
    console.log("successfully deleted user", data)
  } catch (err) {
    console.log("error deleted user:", err)
    throw new Error(err)
  }
}

// Error handling custom class
class Error {
  constructor(message) {
    this.message = message.message
    this.code = message.code
    this.statusCode = message.statusCode
  }
}