const AWS = require('aws-sdk')

// Main Function
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    // Retrieve user sub if it exists
    let userSub;
    if (event.requestContext.identity.cognitoAuthenticationProvider) {
        userSub = event.requestContext.identity.cognitoAuthenticationProvider.split(':CognitoSignIn:')[1]
    } else {
        userSub = null
    }

    // this gives us access to path parameters if they exist
    // these APIs do not use path parameters and opt instead for queryStringParameters
    // and body parameters
    // console.log("pathParameters", event?.pathParameters?.proxy)

    // this gives us a direct line into understanding if the user is authed or not
    // console.log("authed or unauthed?", event.requestContext.identity.cognitoAuthenticationType)
    
    console.log("event", event)
    console.log("httpMethod", event.httpMethod)
    let responseObject;

    switch(event.httpMethod) {
        case "GET": // Get user details
            responseObject = await GetUser(event.queryStringParameters, userSub)
            break;
        case "PUT": // update user details
            console.log("in put")
            responseObject = await UpdateUserData(JSON.parse(event.body), userSub)
            console.log("responseObject after fail username", responseObject)
            break;
        default:    // users cannot delete their accounts as of yet
            break;
    }

    const response = {
        "statusCode": responseObject?.statusCode || 404,
    //  Uncomment below to enable CORS requests
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Content-Type": "application/json"
     }, 
        // "body": responseBody
        "body": responseObject?.responseBody || null
    };

    if (response.statusCode === 200) {
        return response;
    } else {
        let err;
        err = new Error(responseObject.responseBody)
        throw err;
    }
    
};

// Function: GetUser
// Params: query info, and optional userSub
// Retrieves public or private user information. Process is as follows:
// 1. Retrieve username or email from front end
// 2. Use username/email to look up cognitoid in the Uniques Table. If no data exists, 
//      return with a 403 or 404
// 3. Use the cognito id to retrieve user information from the Users Table
//      * If the cognito id doesn't exist, reject the request
//      * If the retrieved cognito id matches that of the session user, send 
//        private user info as well
// 4. Return the fetched data.
//      * For authed users who are requesting for themselves, this data will be used 
//        for updating their settings
//      * For guest users or authed users who are not requesting themselves, 
//        this will be used to retrieve reviews and public user details
//
//  We make GetItem calls to two different tables:
//  * 1) we get the CognitoID for the user from the Uniques Table
//  * 2) use the cognito ID to then get user information from the Users Table
// 
const GetUser = async (query, userSub) => {
    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    // debugging
    // console.log("query params and userSub", query, userSub)
    
    // define the responseObject
    let responseObject = {
        responseBody: '',
        statusCode: 0,
    }

    // additional variables
    let response;               // for DB responses
    let isAuthedUser = false    // bool that is set if requesting user is the desired user

    // * We don't support scans so if there are no query params we want to
    //   set the responseObject to 404 and return
    // * If there is no partition key provided, also return a 404
    if (!query || !query.uniques_pk) {
        // console.log("no query data or uniques_pk")
        responseObject.responseBody = null
        responseObject.statusCode = 404
        return responseObject
    }

    // GetItem request parameters
    // Table - Uniques
    // Key - we provide the full primary key. We populate the "type_sk"
    // field ourselves since we can only query for usernames,
    // Select - we only want specific attributes defined by the 
    // ProjectionExpression and ExpressionAttributeNames
    let params = {
        TableName: 'Uniques',
        Key: {
            "uniques_pk": `${query.uniques_pk}`,
            "type_sk": `${query.type_sk}`
        },
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: '#u, #i',
        ExpressionAttributeNames: {
            '#u': "uniques_pk",
            '#i': "id"
        }
    }

    // Try to get data
    // If error, set response Object and return immediately
    try {
        response = await docClient.get(params).promise()
        response = response.Item
        // console.log("JSON response without item", response)
        responseObject.statusCode = 200
    } catch (err) {
        responseObject.responseBody = "ErrorRetrievingUser"
        responseObject.statusCode = 403
        return responseObject
    }

    // if response is empty, return with a 404
    if (!response) {
        // console.log("return response is null, 404")
        responseObject.statusCode = 404
        return responseObject
    }

    // debugging
    // console.log("get uniques username and id", response)

    // Now that we have the username and id, check if this id matches the 
    // requesting user's id, if so, this is the authed user
    if (response.id === userSub) {
        // console.log("session user is response user")
        isAuthedUser = true
    }

    // Now use this data to get the rest of the desired users data
    // redefine the params variable to the new table and set the partition key
    params = {
        TableName: 'Users',
        Key: {
            "id": `${response.id}`
        },
    }

    // if this is the authed user, return all attributes
    // otherwise set specific attributes
    // for a guest or authed user requesting another's data this will be:
    // * username
    // * name
    // for session users requesting their own data that will be:
    // * username
    // * name
    // * verified
    if (isAuthedUser) {
        params = {
            ...params,
            SELECT: 'ALL_ATTRIBUTES'
        }
    } else {
        params = {
            ...params,
            SELECT: 'SPECIFIC_ATTRIBUTES',
            ProjectionExpression: '#u, #n',
            ExpressionAttributeNames: {
                '#u': "username",
                '#n': "name"
            }
        }
    }

    // console.log("params for user table", params)

    // Try to get data
    try {
        response = await docClient.get(params).promise()
        responseObject.responseBody = JSON.stringify(response.Item)
    } catch (err) {
        responseObject.responseBody = "ErrorRetrievingUser"
        responseObject.statusCode = 403
    }

    return responseObject
}


const UpdateUserData = async (body, userSub) => {

    // debugging
    console.log("body params and userSub for update user data", body, userSub)
    
    // define the responseObject
    let responseObject = {
        responseBody: '',
        statusCode: 200,
    }

    // additional variables
    let emailFlow = false       // to determine which flow to trigger

    let updatedName = null
    let updatedUsername = null
    // * If there are no body params we want to
    //   set the responseObject to 404 and return
    // * If there is no partition key provided, also return a 404
    if (!body || !userSub) {
        console.log("no body data or userSub")
        responseObject.responseBody = null
        responseObject.statusCode = 404
        return responseObject
    }

    if (body?.email) {
        console.log("email val present")
        emailFlow = true
    }

    // if email flow is true, run the email update function
    if (emailFlow) {
        console.log("in email flow")
        responseObject = await UpdateEmail(body, userSub)
    } else {
        console.log("in name/username flow")
        if (body?.name) {
            console.log("name present in body, try updating:", body?.name)
            let temp = await UpdateName(body.name, userSub)
            if (temp.statusCode !== 200) {
                return temp
            }
            updatedName = temp.responseBody.name
        }
        if (body?.username) {
            console.log("username present in body, try updating")
            let temp = await UpdateUsername(body.username, userSub)
            if (temp.statusCode !== 200) {
                console.log("temp", temp)
                return temp
            }
            updatedUsername = temp.responseBody.username        }
    }

    if (updatedName) {
        responseObject.responseBody = {
            ...responseObject.responseBody,
            name: updatedName
        }
    }
    if (updatedUsername) {
        responseObject.responseBody = {
            ...responseObject.responseBody,
            username: updatedUsername
        }
    }

    responseObject.responseBody = JSON.stringify(responseObject.responseBody)
    return responseObject
}


// Update Email
const UpdateEmail = async (body, userSub) => {
    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()
    
    // define the responseObject
    let responseObject = {
        responseBody: '',
        statusCode: 0,
    }

    let currentEmail;



    return responseObject
}

// Update Name
const UpdateName = async (newName, userSub) => {
    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    console.log("in update name")
    let responseObject = {
        responseBody: '',
        statusCode: 0,
    }

    console.log("newName:", newName)

    // update name parameters
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
        response = await docClient.update(params).promise()
        console.log("success updating name, response:", response)
        responseObject.responseBody = {
            ...responseObject.responseBody,
            name: response.Attributes.name
        }
        // console.log("JSON response without item", response)
        responseObject.statusCode = 200
    } catch (err) {
        console.log("error:", err)
        responseObject.responseBody = "ErrorRetrievingUser"
        responseObject.statusCode = 403
        return responseObject
    }

    console.log("response Object after name update", responseObject)
    return responseObject

}

// Update Username
const UpdateUsername = async (newUsername, userSub) => {

    // establish dynamoDB doc client for easier data management
    const docClient = new AWS.DynamoDB.DocumentClient()

    console.log("in update username")
    // define the responseObject
    let responseObject = {
        responseBody: '',
        statusCode: 0,
    }

    let currentUsername;

    // GetItem request parameters for Username
    // This is to check consistency when updating the username
    // Table - Users
    // Key - we provide the partition key since we know the user
    // we want to retrieve
    // Select - we only want the username here
    // We do this because there is a subtle possibility of a race
    // condition if we don't check that the username is the same
    // as when updating as it was moments before
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

    
    // Try to get data
    // If error, set response Object and return immediately
    try {
        response = await docClient.get(params).promise()
        currentUsername = response.Item.username
        console.log("successfully got currentUsername:", currentUsername)
        responseObject.statusCode = 200
    } catch (err) {
        responseObject.responseBody = "ErrorRetievingOriginalUsername"
        responseObject.statusCode = 403
        return responseObject
    }

    console.log("response for get username", currentUsername)

    // if response is empty, return with a 404
    if (!currentUsername) {
        // console.log("return response is null, 404")
        responseObject.statusCode = 404
        return responseObject
    }

    // redefine parameters for the TransactWrite request
    // TransactWrite lets us PUT, UPDATE, and DELETE several
    // items in multiple databases as once. If one fails, the whole
    // transaction fails
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
        response = await docClient.transactWrite(params).promise()
        console.log("success transaction items. response:", response)
        responseObject.responseBody = {
            ...responseObject.responseBody,
            username: newUsername
        }
        responseObject.statusCode = 200
    } catch (err) {
        console.log("error in transact write", err)
        if (err.code === "TransactionCanceledException") {
            responseObject.responseBody = "UsernameTakenError"
        } else {
            responseObject.responseBody = "GenericError"

        }
        
        responseObject.statusCode = 403
        return responseObject
    }

    console.log("responseObject after username update:", responseObject)
    return responseObject;
}



// Query Function with partition + sort key - highly efficient
// ************
// ************
//
// Queries database using the following and returns result
// partition key: unique_pk (email or username)
// sort key: type
//
// ************
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {

//     const docClient = new AWS.DynamoDB.DocumentClient()
//     let responseBody = ""
//     let statusCode = 0

//     const uniques_pk = event.queryStringParameters.uniques_pk
//     const type_sk = event.queryStringParameters.type_sk

//     console.log("uniques_pk", uniques_pk)
//     console.log("type_sk", type_sk)

//     console.log("queryparams", event.queryStringParameters)

//     const params = {
//         TableName: 'Uniques',
//         KeyConditionExpression: `uniques_pk = :value AND type_sk = :value2`,
//         ExpressionAttributeValues: { 
//             ':value': `${uniques_pk}`,
//             ':value2': `${type_sk}`
//         },
//         Select: 'ALL_ATTRIBUTES'
//     }
//     try {
//         const data = await docClient.query(params).promise();
//         responseBody = JSON.stringify(data.Items)
//         statusCode = 200
//     } catch (err) {
//         responseBody = `Unable to get Products: ${err}`
//         statusCode = 403
//     }

//     const response = {
//         "statusCode": statusCode,
//     //  Uncomment below to enable CORS requests
//         "headers": {
//             "Access-Control-Allow-Origin": "*",
//             "Access-Control-Allow-Headers": "*",
//             "Content-Type": "application/json"
//      }, 
//         "body": responseBody
//     };
//     return response;
// };


// Scan Function - avoid whenever possible. Not efficient, especially
// on large databases. Scan reads all items from the db
// ************
// ************
//
// Scans Users-dev database and returns results
//
// ************
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     console.log("event", event)
//     console.log("httpMethod", event.httpMethod)

//     if (event.httpMethod === "GET") {
//         console.log("its a get method!")
//     }
//     const docClient = new AWS.DynamoDB.DocumentClient()
//     let responseBody = ""
//     let statusCode = 0

//     // only need database name for scan
//     const params = {
//         TableName: 'Uniques',
//     }

//     try {
//         const data = await docClient.scan(params).promise();
//         responseBody = JSON.stringify(data.Items)
//         statusCode = 200
//     } catch (err) {
//         responseBody = `Unable to get Products: ${err}`
//         statusCode = 403
//     }

//     const response = {
//         "statusCode": statusCode,
//     //  Uncomment below to enable CORS requests
//         "headers": {
//             "Access-Control-Allow-Origin": "*",
//             "Access-Control-Allow-Headers": "*",
//             "Content-Type": "application/json"
//      }, 
//         "body": responseBody
//     };
//     return response;
// };


// Initial Test
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     console.log(`EVENT: ${JSON.stringify(event)}`);

//     // this works for getting the cognito id of the user who sent the request
//     // good for cross checking or getting info quicker potentially
//     // also potential security checks here
//     if (event.requestContext.identity.cognitoAuthenticationProvider) {
//         let userSub = event.requestContext.identity.cognitoAuthenticationProvider.split(':CognitoSignIn:')[1]
//         console.log("user sub", userSub)
//     }

//     // this gives us a direct line into understanding if the user is authed or not
//     console.log("authed or unauthed?", event.requestContext.identity.cognitoAuthenticationType)
    
//     return {
//         statusCode: 200,
//     //  Uncomment below to enable CORS requests
//      headers: {
//          "Access-Control-Allow-Origin": "*",
//          "Access-Control-Allow-Headers": "*"
//      }, 
//         body: JSON.stringify('Hello from Lambda!'),
//     };
// };
