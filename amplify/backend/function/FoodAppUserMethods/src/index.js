const AWS = require('aws-sdk')

/** 
 * Lambda function for getting or updating private user information. This 
 * function has a restricted URL that is customized to the signed in user 
 * to ensure the user only interacts with their own data.
 */ 


/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */


/**
 *  Function: Main
 *  Params:
 *      event - contains all request details
 *  Purpose: Grabs user sub from request and defines variables needed to process request
 *  Returns: an object containing the response and statusCode
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

   // variables
    let responseBody = {}
    let statusCode = 400
    let userSub;

    // Retrieve user sub if it exists
    if (event.requestContext.identity.cognitoAuthenticationProvider 
        && event.requestContext.identity.cognitoAuthenticationType === "authenticated"
        && !event?.pathParameters?.proxy) {
        userSub = event.requestContext.identity.cognitoAuthenticationProvider.split(':CognitoSignIn:')[1]
    } else {
        userSub = null
        responseBody.message = "No authenticated user found."
        responseBody.name = "NoAuthedUserError"
        statusCode = 400
    }

    if (userSub) {
        // variables for http method and the request parameters
        let httpMethod = event.httpMethod
        let params;

        // set request parameters depending on queryString or event body
        if (event.queryStringParameters) {
            params = event.queryStringParameters
        } else if (event.body) {
            params = JSON.parse(event.body)
        }

        console.log("params after parse", params)

        // process the request and set the return variables
        const { res, status } = await ProcessRequest(userSub, httpMethod, params)
        responseBody = res
        statusCode = status
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
 *      httpMethod - to determine how to interact with the database
 *      params (optional) - required for PUT requests
 *  Purpose: Uses switch statement to determine how to interact with DB based on httpMethod
 *  Returns: an object containing the response and statusCode
 */
const ProcessRequest = async (userSub, httpMethod, params=null) => {
    console.log("processing request with httpmethod", httpMethod)

    // define response variables
    let responseBody = {}
    let statusCode = 0

    switch(httpMethod) {
        case "GET": // Get private user data
            console.log("in get request")
            try {
                let userData = await GetUser(userSub)
                console.log("got user data", userData)
                responseBody = userData
                statusCode = 200
            } catch (err) {
                responseBody.message = err.message
                responseBody.name = err.code
                statusCode = err.statusCode
            }
            break;
        case "PUT": // update user data
            console.log("in put")
            try {
                let updatedUserData = await UpdateUserData(params, userSub)
                console.log("got updated User Data:", updatedUserData)
                responseBody = updatedUserData
                statusCode = 200
            } catch (err) {
                responseBody.message = err.message
                responseBody.name = err.code
                statusCode = err.statusCode 
            }
            break;
        default:    // users cannot delete their data
            break;
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
 * Function: GetUser
 * Params: 
 *     usersub - user sub for database row identification
 *  Purpose: retrieves private user data from Users Table
 *  Returns: the user's Data
 */
const GetUser = async (userSub) => {
    console.log("getting private user data")
    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    // define variables
    let userData;
    let params; 
    let response;

    // Set params
    params = {
        TableName: 'Users',
        Key: {
            "id": `${userSub}`
        },
        SELECT: 'ALL_ATTRIBUTES'
    }

    // debugging
    console.log("params for user table", params)

    // Try to get data
    try {
        console.log("getting user data")
        response = await docClient.get(params).promise()
        console.log("retrieved userData", response)
        userData = response?.Item
    } catch (err) {
        console.log("failed to get private user data with error", err)
        throw new Error(err)
    }

    return userData
}

/**
 * Function: UpdateUserData
 * Params:
 *      params - object containing values to update
 *      usersub - user sub for database row identification
 *  Purpose: updates private user data in the Users/Uniques Table
 *  Returns: an object containing the updated values
 */
const UpdateUserData = async (params, userSub) => {
    console.log("in update user data")

    // define variables
    let response = {}
    let updatedName;
    let uniqueUsername = false
    let updatedUsername;

    // If there are no body params we want to throw an error.
    if (params) {
        // if username is present, update username
        if (params?.username) {
            console.log("username present in params, try updating")

            // first check uniques
            try {
                console.log("checking uniques")
                uniqueUsername = await CheckUniquesTable(params.username)
                console.log("username is unique?", uniqueUsername)
            } catch (err) {
                console.log("username is not unique", err)
                throw new Error(err)
            }
            
            // if unique check is successful, update the username
            try {
                console.log("try updating username")
                updatedUsername = await UpdateUsername(params.username, userSub)
                console.log("got updated username", updatedUsername)
            } catch (err) {
                console.log("error updating username", err)
                throw new Error(err)
            }    
        }
        // if name is present, update name
        if (params?.name) {
            console.log("name present in params, try updating")
            try {
                updatedName = await UpdateName(params.name, userSub)
                console.log("got updated Name:", updatedName)
            } catch (err) {
                console.log("error updating name", err)
                throw new Error(err)
            }
        }

        // set response object
        if (updatedName) {
            response.name = updatedName
        }
        if (updatedUsername) {
            response.username = updatedUsername
        }
    } else {
        throw new Error({
            message: "No user data provided to update.",
            code: "NoUserDataError",
            statusCode: 400
        })
    }

    console.log("final UpdateUserData response", response)
    return response
}

/**
 *  Function: UpdateName
 *  Params: 
 *      newName - updated name for user
 *      userSub - user's sub to identify proper table row
 *  Purpose: Updates the name of the user
 *  Returns: The new name of the user or throws an error
 */
const UpdateName = async (newName, userSub) => {
    console.log("in update name")
    console.log("new name:", newName)

    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    // define variables
    let updatedName;

    // define name parameters
    let params = {
        TableName: 'Users',
        Key: {
            id: `${userSub}`
        },
        UpdateExpression: "set #name = :name",
        ExpressionAttributeNames: {
            "#name": "name"
        },
        ExpressionAttributeValues: {
            ":name": `${newName}`
        },
        ReturnValues: "UPDATED_NEW"
    }

    try {
        console.log("trying to update name")
        let response = await docClient.update(params).promise()
        console.log("success updating name, response:", response)
        updatedName = response?.Attributes?.name
        console.log("new name is: ", updatedName)
    } catch (err) {
        console.log("error updating name:", err)
        throw new Error(err)
    }

    return updatedName
}

/**
 *  Function: CheckUniquesTable
 *  Params: 
 *      newUsername - updated username for user
 *  Purpose: Checks that the username is not currently in use
 *  Returns: True if unique or throws an error
 */
const CheckUniquesTable = async (newUsername) => {
    console.log("in CheckUniquesTable")
    const docClient = new AWS.DynamoDB.DocumentClient()
    
    // define variable
    let response;
  
    // set params for the email we wish to check
    let params = {
        TableName: "Uniques",
        Key: {
            "uniques_pk": `${newUsername}`,
            "type_sk": "username"
        }
    }
  
    // debugging
    console.log("params for docClient: ", params)
  
    /**
     * try to get the username from the uniques table
     * if nothing is returned, the username is unique
     * otherwise, we have a match and the username is not unique
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
        // username exists, throw error
        throw new Error({
          message: "This username is already in use, please try another.",
          code: "UsernameExistsError",
          statusCode: 400
        })
    }
  
    return true
}

/**
 *  Function: UpdateUsername
 *  Params: 
 *      newUsername - updated username for user
 *      userSub - user's sub to identify proper table row
 *  Purpose: Checks uniqueness and updates the Uniques and Users 
 *           table with the new username of the user
 *  Returns: The new username of the user or throws an error
 */
const UpdateUsername = async (newUsername, userSub) => {
    console.log("in update username")
    console.log("new username:", newUsername)

    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    // define variables
    let currentUsername;

    /**
     * GetItem request parameters for Username
     * This is to check consistency when updating the username
     * We do this because there is a subtle possibility of a race
     * condition if we don't check that the username is the same
     * when updating as it was moments before
     */
    let params = {
        TableName: 'Users',
        Key: {
            "id": `${userSub}`,
        },
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: '#u',
        ExpressionAttributeNames: {
            '#u': "username"
        }
    }

    // Try to get current username
    try {
        let response = await docClient.get(params).promise()
        currentUsername = response?.Item?.username
        if (!currentUsername) {
            throw new Error({
                message: "Could not retrieve current username.",
                code: "UnableToRetrieveUsername",
                statusCode: 400
            })
        }
    } catch (err) {
        console.log("unable to retrieve new username", err)
        throw new Error(err)
    }

    console.log("successfully got currentUsername:", currentUsername)

    /**
     * redefine parameters for the TransactWrite request
     * TransactWrite lets us PUT, UPDATE, and DELETE several
     * items in multiple databases as once. If one fails, the whole
     * transaction fails
     */
    params = {
        TransactItems: [
            {
                // Update username of user in Users Table
                Update: {
                    TableName: 'Users',
                    Key: {
                        id: `${userSub}`
                    },
                    UpdateExpression: "SET #username = :username",
                    ConditionExpression: "#username = :currentUsername",
                    ExpressionAttributeNames: {
                        "#username": "username"
                    },
                    ExpressionAttributeValues: {
                        ":username": `${newUsername}`,
                        ":currentUsername": `${currentUsername}`
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
                        uniques_pk: `${currentUsername}`,
                        type_sk: "username"
                    }
                }
            },
            {
                // Add Item to Uniques Table
                Put: {
                    TableName: 'Uniques',
                    // check not exists for username
                    ConditionExpression: "attribute_not_exists(#u)",
                    ExpressionAttributeNames: {
                        "#u": "uniques_pk"
                    },
                    // attributes we're adding to the Table
                    Item: {
                        uniques_pk: `${newUsername}`,
                        type_sk: "username",
                        id: `${userSub}`
                    },
                }
            },

        ]
    }

    // Try to update tables
    // If error, set response Object and return immediately
    try {
        let response = await docClient.transactWrite(params).promise()
        console.log("success transaction items. response:", response)
    } catch (err) {
        console.log("error in transact write", err)
        throw new Error(err)
    }

    return newUsername;
}

// Error handling custom class
class Error {
    constructor(message) {
        this.message = message.message
        this.code = message.code
        this.statusCode = message.statusCode
    }
}