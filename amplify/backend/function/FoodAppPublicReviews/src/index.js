const AWS = require('aws-sdk')

/** 
 * Lambda function for getting public reviews based on the username in the
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
 *  Purpose: Grabs username and optional review_id from request path parameters 
 *              and defines variables needed to process request
 *  Returns: an object containing the response and statusCode
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // define variables
    let username;
    let userSub;
    let responseBody = {};
    let statusCode = 400
    let userReviews;

    if (event.pathParameters.username) {
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

    // if userSub exists, try getting public reviews
    if (userSub) {  
        // get review_id if it exists
        let review_id = event?.pathParameters?.proxy  
        try {
            console.log("user sub exists. Get public review(s)")
            userReviews = await GetPublicUserReviews(userSub, review_id)
            console.log("user reviews exist. Set response body.")
            statusCode = 200
            responseBody = userReviews
        } catch (err) {
            console.log("error retrieving user review(s)", err)
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
 *  Function: GetPublicUserReviews
 *  Params: 
 *      usersub - user sub for database row identification
 *      review_id (optional) - to get specific review
 *  Purpose: Uses userSub and optional review_id to that user's public review(s)
 *  Returns: an array of reviews (can be empty)
 */
const GetPublicUserReviews = async (userSub, review_id=null) => {
    console.log("getting public reviews")
    const docClient = new AWS.DynamoDB.DocumentClient()

    // define variables
    let reviews;    // with either be a single object or an array of objects
    let params; 
    let response;

    // set up single review db params (get item) if review_id is present
    if (review_id) {
        params = {
            TableName: 'Reviews',
            Key: {
            "user_id": `${userSub}`,
            "review_id": `${review_id}`
            },
        } 
    // set up multiple reviews db params (query)
    } else {
        params = {
            TableName: 'Reviews',
            KeyConditionExpression: "#id = :id",
            FilterExpression: "#p = :bool",
            ExpressionAttributeNames: {
                "#id": "user_id",
                "#p": "private"
            },
            ExpressionAttributeValues: {
                ":id": `${userSub}`,
                ":bool": 0
            }
        }
    }

    // Try to get data
    if (review_id) {    // single reivew
        try {
            console.log("getting single review")
            response = await docClient.get(params). promise()
            console.log("response", response)

            // if the review is private or doesn't exist, throw an error
            if(response?.Item?.private || response?.Item === undefined) {
                console.log("review is private or doesn't exist.")
                throw new Error({
                    message: "The requested review does not exist",
                    code: "ReviewNotFoundError",
                    statusCode: 404
                })
            }

            // set reviews variable
            console.log("response.item", response.Item)
            reviews = response.Item;
        } catch (err) {
            console.log("failed to get single public review with error", err)
            throw new Error(err)
        }
    } else {            // multiple reviews
        try {
            console.log("getting all public reviews")
            response = await docClient.query(params).promise()
            console.log("response", response)
            console.log("response.item", response.Items)
            reviews = response.Items;
        } catch (err) {
            console.log("failed to get public reviews with error", err)
            throw new Error(err)
        }
    }

    return reviews;
}

// Error handling custom class
class Error {
    constructor(message) {
        this.message = message.message
        this.code = message.code
        this.statusCode = message.statusCode
    }
}