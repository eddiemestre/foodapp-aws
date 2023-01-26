const AWS = require('aws-sdk')
const { randomUUID } = require('crypto');

/** 
 * Lambda function for getting private reviews or updating/posting/deleting 
 * the signed in user's own reviews. This function has a restricted URL that 
 * is customized to the signed in user to ensure the user only interacts with 
 * their own data.
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
    if (event.requestContext.identity.cognitoAuthenticationProvider && 
        event.requestContext.identity.cognitoAuthenticationType === "authenticated") {
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
        let review_id = event?.pathParameters?.proxy

        // set request parameters depending on queryString or event body
        if (event.queryStringParameters) {
            params = event.queryStringParameters
        } else if (event.body) {
            params = JSON.parse(event.body)
        }

        console.log("params after parse", params)

        // process the request and set the return variables
        const { res, status } = await ProcessRequest(userSub, httpMethod, params, review_id)
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
 *      params (optional) - required for POST and PUT requests (provides review data)
 *      review_id (optional) - required for GET and DELETE requests (provides review id)
 *  Purpose: Uses switch statement to determine how to interact with DB based on httpMethod
 *  Returns: an object containing the response and statusCode
 */
const ProcessRequest = async (userSub, httpMethod, params=null, review_id=null) => {
    console.log("processing request with httpmethod", httpMethod)

    // define response variables
    let responseBody = {}
    let statusCode = 0

    switch(httpMethod) {
        case "GET": // Get user reviews
            console.log("in get request")
            try {
                let reviews = await GetUserReviews(userSub, review_id)
                console.log("got reviews", reviews)
                responseBody = reviews
                statusCode = 200
            } catch (err) {
                responseBody.message = err.message
                responseBody.name = err.code
                statusCode = err.statusCode
            }
            break;
        case "POST":    // create new review
            console.log("in post")
            try {
                let postResponse = await PostReview(userSub, params)
                console.log("got post response")
                responseBody = postResponse
                statusCode = 200
            } catch (err) {
                responseBody.message = err.message
                responseBody.name = err.code
                statusCode = err.statusCode
            }
            break;
        case "PUT": // edit existing review
            console.log("in put for update")
            try {
                let putResponse = await UpdateReview(userSub, review_id, params)
                console.log("got update response")
                responseBody = putResponse
                statusCode = 200
            } catch (err) {
                responseBody.message = err.message
                responseBody.name = err.code
                statusCode = err.statusCode
            }
            break;
        case "DELETE": // delete a review
            console.log("in delete")
            try {
                let deleteResponse = await DeleteReview(userSub, review_id)
                console.log("got delete response", deleteResponse)
                responseBody = deleteResponse
                statusCode = 200
            } catch (err) {
                responseBody.message = err.message
                responseBody.name = err.code
                statusCode = err.statusCode
            }
            break;
        default:
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
 *  Function: GetUserReviews
 *  Params: 
 *      usersub - user sub for database row identification
 *      review_id (optional) - required to get SPECIFIC review data
 *  Purpose: Does one of two things:
 *              1) retrieves all reviews for user of provided sub if
 *                  is no review_id is present
 *              2) retrieves SPECIFIC review for user of provided sub
 *                  if review_id is present
 *  Returns: One of two things:
 *              1) A single object with review data (if provided a review_id)
 *              2) An array of objects with all review data for the user
 */
const GetUserReviews = async (userSub, review_id=null) => {
    console.log("getting private reviews")
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
            ExpressionAttributeNames: {
                "#id": "user_id"
            },
            ExpressionAttributeValues: {
                ":id": `${userSub}`
            }
        }
    }
    
    // Try to get data
    if (review_id) {
        try {
            console.log("getting single review")
            response = await docClient.get(params).promise()
            console.log("response", response)
            console.log("response.item", response?.Item)
            reviews = response?.Item;
        } catch (err) {
            console.log("failed to get private reviews with error", err)
            throw new Error(err)
        }
    } else {
        try {
            console.log("getting all reviews")
            response = await docClient.query(params).promise()
            console.log("response", response)
            console.log("response.item", response?.Items)
            reviews = response?.Items;
        } catch (err) {
            console.log("failed to get private reviews with error", err)
            throw new Error(err)
        }
    }

    return reviews;
}


/**
 *  Function: PostReview
 *  Params: 
 *      usersub - user sub for database row identification/creation
 *      params - review data from the frontend we want to add to the database
 *  Purpose: Writes new item to Reviews table for the specified user
 *  Returns: An object containing the newly written review data
 *  Note: We use the UPDATE method when interacting with the database. This
 *          is because we need to retrieve the created review once we have written
 *          it and use the newly created review_id (a randomized uuid) to determine
 *          the review's frontend URL. We can retrieve this data by setting
 *          ReturnValues: "ALL_NEW" which returns the newly created row data to us.
 *          DynamoDB's PUT method can create new items, but cannot return them
 *          upon creation, which is behavior we need. 
 */
const PostReview = async (userSub, params) => {
    const docClient = new AWS.DynamoDB.DocumentClient()
    
    // define variables
    let review;

    // define update expression to set the variables
    let updateExpression = "set #content = :content, "
                            +   "#date = :date, " 
                            +   "#title = :title, "
                            +   "#private = :private, "
                            +   "#updatedAt = :updatedAt, "
                            +   "#createdAt = :createdAt"
    
    // define database parameters. Note that we generate a randomUUID for the review_id
    let dbParams = {
        TableName: 'Reviews',
        Key: {
            user_id: `${userSub}`,
            review_id: `${randomUUID()}`,
        },
        // check not exists for the specified review_id
        ConditionExpression: "attribute_not_exists(#review_id)",
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
            "#review_id": "review_id",
            "#content": "content",
            "#date": "date",
            "#title": "title",
            "#private": "private",
            "#updatedAt": "updatedAt",
            "#createdAt": "createdAt"
        },
        // attributes we're adding to the Table
        ExpressionAttributeValues: {
            ":content": `${params.content}`,
            ":date": `${params.date}`,
            ":title": `${params.title}`,
            ":private": params.private,
            ":updatedAt": `${params?.updatedAt ? params?.updatedAt : new Date()}`,
            ":createdAt": `${params?.createdAt ? params?.createdAt : new Date()}`
        },
        ReturnValues: "ALL_NEW"
    }

    // debugging
    console.log("dbParams", dbParams)

    try {
        console.log("trying to put item in DB")
        const response = await docClient.update(dbParams).promise();
        console.log("Put item in DB response:", response.Attributes)
        review = response?.Attributes
    } catch (err) {
        console.log("error putting item in DB", err)
        throw new Error(err)
    }

    console.log("review after put", review)
    return review;
}

/**
 *  Function: UpdateReview
 *  Params: 
 *      usersub - user sub for database row identification/creation
 *      review_id - review id to identify the row we wish to update
 *      params - review data from the frontend we want to add to the database
 *  Purpose: Updates item in the Reviews table for the specified user
 *  Returns: An object containing the review data of the updated review
 */
const UpdateReview = async (userSub, review_id, params) => {
    const docClient = new AWS.DynamoDB.DocumentClient()
    console.log("in update review")
    
    // define variables
    let review;
    // set items depending on params
    let setItems = 'set '
    let attributeNames = {}
    let attributeValues = {}

    /**
     * since we set (update) items in a table using the UpdateExpression,
     * we have to build a string of the variables we wish to update along 
     * with their corresponding updated values
     */
    if (params?.title) {
        console.log("title val exists")
        setItems += "#title = :title, "
        attributeNames["#title"] = "title"
        attributeValues[":title"] = `${params?.title}`
    }
    if (params?.date) {
        setItems += "#date = :date, "
        console.log("date val exists")
        attributeNames["#date"] = "date"
        attributeValues[":date"] = `${params?.date}`
    }
    if (params?.content) {
        console.log("content val exists")
        setItems += "#content = :content, "
        attributeNames["#content"] = "content"
        attributeValues[":content"] = `${params?.content}`
    }
    if ("private" in params) {  // private can be false so we need to check presence
        console.log("private val exists")
        setItems += "#private = :private, "
        attributeNames["#private"] = "private"
        attributeValues[":private"] = params?.private
    }

    // set review update date
    setItems += "#updatedAt = :updatedAt"
    attributeNames["#updatedAt"] = "updatedAt"
    attributeValues[":updatedAt"] = `${params?.updatedAt ? params?.updatedAt : new Date()}`
    

    // debugging
    console.log("setItems", setItems)
    console.log("attributeNames", attributeNames)
    console.log("attributeValues", attributeValues)

    // finalize the db parameters
    let dbParams = {
        TableName: "Reviews",
        Key: {
            "user_id": `${userSub}`,
            "review_id": `${review_id}`
        },
        UpdateExpression: setItems,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,  
        ReturnValues: "ALL_NEW"                                                                                                                                                                                                                                                                             
    }

    // debugging
    console.log("dbParams", dbParams)

    // Try updating review
    try {
        console.log("trying to update review")
        const response = await docClient.update(dbParams).promise()
        console.log("update review response", response)
        review = response?.Attributes
    } catch (err) {
        console.log("error updating revew", err)
        throw new Error(err)
    }

    console.log("update review final result", review)
    return review
}

/**
 *  Function: DeleteReview
 *  Params: 
 *      usersub - user sub for database row identification/creation
 *      review_id - review id to identify the row we wish to delete
 *  Purpose: Deletes a review with the specified primary key if it exists
 *  Returns: A success message
 */
const DeleteReview = async (userSub, review_id) => {
    const docClient = new AWS.DynamoDB.DocumentClient()
    console.log("delete review")
    
    // define variable
    let response;

    // define db parameters. We just need the primary key (partition and sort key)
    // to delete a row
    params = {
        TableName: "Reviews",
        Key: {
            user_id: `${userSub}`,
            review_id: `${review_id}`
        }
    }

    // Try deleting review
    try {
        console.log("trying to delete item from DB")
        await docClient.delete(params).promise();   // returns nothing
        response = "Successfully deleted review."
    } catch (err) {
        console.log("error deleting item from DB", err)
        throw new Error(err)
    }

    console.log("delete review final response", response)
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