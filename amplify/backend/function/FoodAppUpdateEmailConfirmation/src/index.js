const AWS = require('aws-sdk')

/** 
 * Lambda function for confirming an updated email. Checks that the email
 * is unique and updates the necessary tables and cognito data store.
 */ 

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

/**
 *  Function: Main
 *  Params:
 *      event - contains all request details
 *  Purpose: Grabs user accessToken and confirmation code and uses those to verify
 *  the user's new email address.
 *  Returns: an object containing the response and statusCode
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // variables
    let responseBody = {}
    let statusCode = 400
    let userSub;


    // Retrieve user sub if it exists
    if (event.requestContext.identity.cognitoAuthenticationProvider && event.requestContext.identity.cognitoAuthenticationType === "authenticated") {
        userSub = event.requestContext.identity.cognitoAuthenticationProvider.split(':CognitoSignIn:')[1]
    } else {
        userSub = null
        responseBody.message = "No authenticated user found."
        responseBody.name = "NoAuthedUserError"
        statusCode = 400
    }

    if (userSub) {
        // parse request body params
        let parsedEvent = JSON.parse(event.body)
        console.log("parsedEvent", parsedEvent)

        if(parsedEvent?.accessToken && parsedEvent?.Code && parsedEvent?.newEmail) {
            // process the request and set the return variables
            const { res, status } = await ProcessRequest(userSub, parsedEvent)
            responseBody = res
            statusCode = status
        }
    } else {
        console.log(`Error: Missing parameters necessary to update email: ${parsedEvent}`)
        responseBody.message = "Missing info needed to update, please try again."
        responseBody.name = "MissingCredentialsError"
        statusCode = 400
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
 *  Function: ProcessRequest
 *  Params: 
 *      usersub - user sub for database row identification
 *      parsedEvent - parameters necessary to interact with the database
 *  Purpose: series of database interactions that execute if the previous was successful
 *  Returns: an object containing the response and statusCode
 */
const ProcessRequest = async (userSub, parsedEvent) => {

    // define variables
    let responseBody = {}
    let statusCode = 400

    let userIsUnique = false;         // default
    let successConfirmingEmail = false // default
    let successPopulatingTables = false;    // defualt
    let prevEmail;

    // check uniques
    try {
        console.log("check that new email is unique")
        userIsUnique = await CheckUniquesTable(parsedEvent?.newEmail);
        console.log("new Email is unique?", userIsUnique)
    } catch (err) {
        console.log(err)
        responseBody.message = err.message
        responseBody.name = err.code
        statusCode = err.statusCode
    }

     // if user is unique, try confirming email
     if (userIsUnique) {
        try {
          console.log("try confirming email")
          successConfirmingEmail = await ConfirmUserEmail(parsedEvent)
          console.log("success confirming email with response", successConfirmingEmail)
        } catch (err) {
          console.log("issue confirming email", err)
          responseBody.message = err.message
          responseBody.name = err.code
          statusCode = err.statusCode
        }
    }

    // get the previous email from the user table


    // if we successfully confirmed email, add email data to tables
    if (successConfirmingEmail) {
        try {
            console.log("try getting previous Email")
            prevEmail = await GetPrevEmail(userSub)
            console.log("retrieved previous email:", prevEmail)
        } catch (err) {
            console.log("error fetching previous email:", err)
            responseBody.message = err.message
            responseBody.name = err.code
            statusCode = err.statusCode
        }

        if (prevEmail) {
            try {
                console.log("try updating email")
                successPopulatingTables = await UpdateEmail(prevEmail, parsedEvent?.newEmail, userSub)
                console.log("successfully updated email", successPopulatingTables)
                statusCode = 200;
                responseBody = "Successfully updated email."
            } catch (err) {
                console.log("error updating email to database after confirmation.", err)
                responseBody.message = err.message
                responseBody.name = err.code
                statusCode = err.statusCode
            }
        } else {
            responseBody.message = "A previous email value doesn't exist."
            responseBody.name = "InternalServiceError"
            statusCode = 500
        }
    }

    /**
     * if successPopulatingTables is false, there was an error
     * adding the email to the database. We'll need to manually
     * reset the original email and have them re-do email confirmation.
     */
    if (successConfirmingEmail && !successPopulatingTables) {
        try {
          console.log("rolling back email")
          await RollbackEmail(parsedEvent, prevEmail);
          console.log("success rolling back email.")
    
          // unique instance where we want to throw a 400 on success
          responseBody.message = "Unable to verify email, please try again."
          responseBody.name = "ForcedUnverificationError"
          statusCode = 400
        } catch (err) {
          console.log("error rolling back email.", err)
          responseBody.message = err.message
          responseBody.name = err.code
          statusCode = err.statusCode
        }
    }

    // define response object
    let returnResponse = {
        res: responseBody,
        status: statusCode
    }

    console.log("Process Request response", returnResponse)
    return returnResponse; 
}


/**
 *  Function: CheckUniquesTable
 *  Params: 
 *      new_email - updated email for user
 *  Purpose: Checks that the email and username are not currently in use
 *  Returns: True if unique or throws an error
 */
const CheckUniquesTable = async (new_email) => {
    console.log("in CheckUniquesTable")
    const docClient = new AWS.DynamoDB.DocumentClient()
    
    // define variable
    let response;
  
    // set params for the email we wish to check
    let params = {
        TableName: "Uniques",
        Key: {
            "uniques_pk": `${new_email}`,
            "type_sk": "email"
        }
    }
  
    // debugging
    console.log("params for docClient: ", params)
  
    /**
     * try to get the email from the uniques table
     * if nothing is returned, the email is unique
     * otherwise, we have a match and the email is not unique
     */
    try {
      response = await docClient.get(params).promise()
      console.log("checked uniques. Data found:", response)
    } catch (err) {
      console.log("Error while checking uniques", err)
      throw new Error(err)
    }
  
    // if the response is not an empty array, we have a match
    if (response?.Item?.uniques_pk) {
        console.log("uniques data exists", response?.Item?.uniques_pk)
        // email exists, throw error
        throw new Error({
          message: "This email is already in use, please try another.",
          code: "EmailExistsError",
          statusCode: 400
        })
    }
  
    return true
}


/**
 *  Function: ConfirmUserEmail
 *  Params:
 *      parsedEvent - contains confirmation code and email
 *  Purpose: Verifies user email in user pool allowing user to sign in with new email
 *  Returns: True if email is confirmed or an error
 */
const ConfirmUserEmail = async (parsedEvent) => {
    // define indentity provider
    let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

    // define parameters for email confirmation
    const params = {
        AccessToken: `${parsedEvent.accessToken}`,
        AttributeName: `email`,
        Code: `${parsedEvent.Code}`,
    }

    // try confirming email
    try {
        const data = await cognitoidentityserviceprovider.verifyUserAttribute(params).promise();
        console.log("successfully confirmed email", data)
    } catch (err) {
        console.log("update email cognito error:", err)
        throw new Error(err)
    }

    return true
}

/**
 *  Function: GetPrevEmail
 *  Params:
 *      userSub - for identifying correct table rows
 *  Purpose: Retrieves the user's previous email (still populated in uniques/users tables)
 *  Returns: string for previous email or an error
 */
const GetPrevEmail = async (userSub) => {
    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    // define variable
    let response;
    let currentEmail;

    /**
     *  GetItem request parameters for Email
     *  This is to check consistency when updating the email
     *  Table - Users
     *  Key - we provide the partition key since we know the user
     *        we want to retrieve
     *  Select - we only want the email here. We do this because 
     *           there is a subtle possibility of a race condition if we 
     *           don't check that the email is the same as when updating 
     *           as it was moments before
     */
    let params = {
        TableName: 'Users',
        Key: {
            "id": `${userSub}`,
        },
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: '#e',
        ExpressionAttributeNames: {
            '#e': "email"
        }
    }

    // Try to get data
    try {
        response = await docClient.get(params).promise()
        console.log("got email result:", response)
        currentEmail = response?.Item?.email
        console.log("successfully got currentEmail:", currentEmail)
    } catch (err) {
        console.log("Error retrieving current user email:", err)
        throw new Error(err)
    }

    console.log("current Email:", currentEmail)

    // if response is empty, throw with a 404
    if (!currentEmail) {
        throw new Error({
            message: "No existing email found for user.",
            code: "EmailNotFoundError",
            statusCode: 404
        })
    }

    return currentEmail

}


/**
 *  Function: UpdateEmail
 *  Params:
 *      currentEmail - the current database email (previous email)
 *      newEmail - new user email
 *      userSub - the user's sub whose email we are updating
 *  Purpose: Updates email in the Users and Uniques tables via BatchWrite
 *  Returns: True if email is added successfully, or an error
 */
const UpdateEmail = async (currentEmail, newEmail, userSub) => {
    console.log("in UpdateEmail")

    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    // define variable
    let response;

    /**
     * redefine parameters for the TransactWrite request
     * TransactWrite lets us PUT, UPDATE, and DELETE several
     * items in multiple databases as once. If one fails, the whole
     * transaction fails
     */
    params = {
        TransactItems: [
            {
                // Update email of user in Users Table
                Update: {
                    TableName: 'Users',
                    Key: {
                        id: `${userSub}`
                    },
                    UpdateExpression: "SET #email = :email",
                    // ensure current email is what's currently in table
                    ConditionExpression: "#email = :currentEmail",
                    ExpressionAttributeNames: {
                        "#email": "email"
                    },
                    ExpressionAttributeValues: {
                        ":email": `${newEmail}`,
                        ":currentEmail": `${currentEmail}`
                    }
                }
            },
            {
                Delete: {
                    TableName: 'Uniques',
                    // check that the attribute exists
                    ConditionExpression: "attribute_exists(#u)",
                    ExpressionAttributeNames: {
                        "#u": "uniques_pk"
                    },
                    // item we are deleting from Table
                    Key: {
                        uniques_pk: `${currentEmail}`,
                        type_sk: "email"
                    }
                }
            },
            {
                // Add Item to Uniques Table
                Put: {
                    TableName: 'Uniques',
                    // check not exists for email
                    ConditionExpression: "attribute_not_exists(#u)",
                    ExpressionAttributeNames: {
                        "#u": "uniques_pk"
                    },
                    // attributes we're adding to the Table
                    Item: {
                        uniques_pk: `${newEmail}`,
                        type_sk: "email",
                        id: `${userSub}`
                    },
                }
            },

        ]
    }

    // Try to update tables
    try {
        response = await docClient.transactWrite(params).promise()
        console.log("success transaction items. response:", response)
    } catch (err) {
        console.log("error in transact write", err)
        throw new Error(err)
    }

    return true
}


/**
 *  Function: RollbackEmail
 *  Params:
 *      parsedEvent - contains old Email
 *  Purpose: rollsback email of user in userpool
 *  Returns: Nothing or an error
 */
const RollbackEmail = async (parsedEvent, prevEmail) => {
    console.log("in rollback email with prev email", prevEmail)
    let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
  
    // define user pool data (retrieved from console)
    const poolData = {
      UserPoolId: "us-west-2_xppYTNPHq",
      AppClientId: "37ar0fs228co0246khbhkbu9sc"
    }
  
    // define parameters for deletion
    const params = {
        UserPoolId: `${poolData.UserPoolId}`,
        Username: `${parsedEvent.newEmail}`,   // username should be an email
        UserAttributes: [
            {
                Name: "email",
                Value: prevEmail
            },
            {
                Name: "email_verified",
                Value: "true"
            }
        ]
    }
  
    // try deleting account
    try {
      console.log("try rolling back email")
      const data = await cognitoidentityserviceprovider.adminUpdateUserAttributes(params).promise();
      console.log("successfully rolled  back email", data)
    } catch (err) {
      console.log("error rolling back email:", err)
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