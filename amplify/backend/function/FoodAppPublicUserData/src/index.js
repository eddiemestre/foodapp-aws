const AWS = require('aws-sdk')

/** 
 * Lambda function for getting public user data based on the username in the
 * path parameters. This function has no restrictions and can be called by
 * all authed and guest users. 
 */ 


/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

/**
 *  Function: Main
 *  Params: 
 *      event - contains all request details
 *  Purpose: Grabs username from request path parameters and defines 
 *  variables needed to process request
 *  Returns: an object containing the response and statusCode
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // define variables
    let username;
    let userSub;
    let responseBody = {};
    let statusCode = 400
    let userData;

    if (event?.pathParameters?.username && !event?.pathParameters?.proxy) {
        username = event.pathParameters.username
    } else {
        console.log("no username in path")
        responseBody.message = "No user found for public reviews."
        responseBody.name = "NoUsernameFoundError"
        statusCode = 400
    }
    
    // if username is present, try getting user details
    if (username) {
        try {
            console.log("username exists. Get user sub")
            userSub = await GetUserSub(username)
            console.log("got user sub")
        } catch (err) {
            console.log("error getting usersub", err)
            responseBody.message = err.message
            responseBody.name = err.code
            statusCode = err.statusCode
        }
    }

    // if userSub exists, try getting public user data
    if (userSub) {  
        try {
            console.log("user sub exists. Get public review(s)")
            userData = await GetPublicUserData(userSub)
            console.log("user data exists. Set response body.")
            statusCode = 200
            responseBody = userData
        } catch (err) {
            console.log("error retrieving user data", err)
            responseBody.message = err.message
            responseBody.name = err.code
            statusCode = err.statusCode
        }
    }

    const response = {
        statusCode: statusCode,
    //  Uncomment below to enable CORS requests
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }, 
        body: JSON.stringify(responseBody),
    };

    console.log("final response", response)
    return response;
};


/**
 *  Function: GetUserSub
 *  Params: 
 *      username - username for database row identification
 *  Purpose: Uses username to grab userSub from the Uniques Table
 *  Returns: the userSub if it exists or an error
 */
const GetUserSub = async (username) => {
    console.log("getting user sub from username")
    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    // define variable
    let userSub;

    // set db parameters. We only want the user's id from the table
    let params = {
        TableName: 'Uniques',
        Key: {
            "uniques_pk": `${username}`,
            "type_sk": "username"
        },
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: '#i',
        ExpressionAttributeNames: {
            '#i': "id"
        }
    }

    // Try to get data
    try {
        let response = await docClient.get(params).promise()
        console.log("user sub response", response)
        if (response?.Item?.id) {
            userSub = response.Item.id;
            console.log("retrieved user sub", userSub)
        } else {
            throw new Error({
                message: "User sub does not exist.",
                code: "InvalidUserSubError",
                statusCode: 404
            })
        }
    } catch (err) {
        console.log("Error getting userSub", err)
        throw new Error(err)
    }

    return userSub;
}

/**
 *  Function: GetPublicUserData
 *  Params: 
 *      userSub - usersub for database row identification
 *  Purpose: Uses usersub to grab user data from the Users Table
 *  Returns: the public user data if it exists or an error
 */
const GetPublicUserData = async (userSub) => {
    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    // debugging
    console.log("in GetPublicUserData. userSub:", userSub)

    // define variables
    let response;               // for DB responses
    let userData;

    // Use user sub to get data from dB
    // select specific attributes - public attributes are username and name
    let params = {
        TableName: 'Users',
        Key: {
            "id": `${userSub}`
        },
        SELECT: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: '#u, #n',
        ExpressionAttributeNames: {
            '#u': "username",
            '#n': "name"
        }
    }

    // debugging
    console.log("params for user table", params)

    // Try to get data
    try {
        response = await docClient.get(params).promise()
        userData = response?.Item
    } catch (err) {
        console.log("error getting public user data", err)
        throw new Error(err)
    }

    if (!Object.keys(userData).length) {
        throw new Error({
            message: "User data does not exist.",
            code: "NoUserDataError",
            statusCode: 404
        })
    }

    return userData
}


// Error handling custom class
class Error {
    constructor(message) {
        this.message = message.message
        this.code = message.code
        this.statusCode = message.statusCode
    }
}