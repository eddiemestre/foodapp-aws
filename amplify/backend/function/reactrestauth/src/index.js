/* Amplify Params - DO NOT EDIT
	API_REACTRESTAUTHAPI_APIID
	API_REACTRESTAUTHAPI_APINAME
	ENV
	REGION
Amplify Params - DO NOT EDIT */const AWS = require('aws-sdk')
// put, update, delete, get, query no sort, query w/sort, scan


// Put Function
// Updates record if a matching record is found,
// otherwise, creates a new record - prefer update 
// when updating!
// ************
// ************
//
// Puts new item in database using the event body params
//
// ************
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    if (event.requestContext.authorizer) {
        console.log(event)
        console.log("claims", event.requestContext.authorizer.claims)
    }

    const docClient = new AWS.DynamoDB.DocumentClient()
    let responseBody = ""
    let statusCode = 0

    const data = JSON.parse(event.body)

    console.log("cognito id", data.cognitoid)
    console.log('username', data.username)
    console.log('name', data.name)
    console.log('verified', data.verified)

    // params
    const params = {
        TableName: 'Users-dev',
        Item: {
            cognitoid: data.cognitoid,
            username: data.username,
            name: data.name,
            verified: data.verified
        }
    }
    
    try {
        const data = await docClient.put(params).promise();
        responseBody = JSON.stringify(data)
        statusCode = 200
    } catch (err) {
        responseBody = `Unable to get Products: ${err}`
        statusCode = 403
    }
    
    console.log("responseBody", responseBody)

    const response = {
        "statusCode": statusCode,
    //  Uncomment below to enable CORS requests
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Content-Type": "application/json"
     }, 
        "body": responseBody
    };
    return response;
};

// Update Function
// Updates record if a matching record is found,
// otherwise, creates a new record - prefer put when 
// adding new data
// requires full primary key - pk and sk
// 
// Returns the updated new values
// ************
// ************
//
// Updates item in database using the event body params
//
// ************
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     if (event.requestContext.authorizer) {
//         console.log(event)
//         console.log("claims", event.requestContext.authorizer.claims)
//     }

//     const docClient = new AWS.DynamoDB.DocumentClient()
//     let responseBody = ""
//     let statusCode = 0

//     const data = JSON.parse(event.body)

//     // we should only be updating the data that we receive in the body 
//     // if it isn't in the body, it doesn't need to be updated
//     // determining what should be updated should be done on front end
//     let attributeNames = {}
//     let attributeValues = {}
//     let updateExpression = 'set '

//     // cognito id and username cannot be updated, only used for 
//     // identification
//     if (data.name) {
//         attributeNames['#n'] = "name"
//         attributeValues[":nval"] = data.name
//         updateExpression += "#n = :nval, "
//     }
//     if (data.email) {
//         attributeNames['#e'] = "email"
//         attributeValues[":eval"] = data.email
//         updateExpression += "#e = :eval, "
//     }
//     if (data.verified) {
//         attributeNames['#v'] = "verified"
//         attributeValues[":vval"] = data.verified
//         updateExpression += "#v = :vval, "
//     }

//     // remove last two characters from updateExpression
//     updateExpression = updateExpression.substring(0, updateExpression.length - 2)
   
//     // logs for testing
//     console.log("updateExpression", updateExpression)
//     console.log("attributeNames", attributeNames)


//     // params
//     // requires full primary key - partition key and 
//     // sort key if sort key is defined
//     const params = {
//         TableName: 'Users-dev',
//         Key: {
//             cognitoid: data.cognitoid,
//             username: data.username
//         },
//         UpdateExpression: updateExpression,
//         ExpressionAttributeNames: attributeNames,
//         ExpressionAttributeValues: attributeValues,
//         ReturnValues: "UPDATED_NEW"
//     }
    
//     try {
//         const data = await docClient.update(params).promise();
//         responseBody = JSON.stringify(data)
//         statusCode = 200
//     } catch (err) {
//         responseBody = `Unable to get Products: ${err}`
//         statusCode = 403
//     }
    
//     console.log("responseBody", responseBody)

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


// Delete Function
// deletes record if a matching record is found otherwise
// throws a 400 error
// requires full primary key - pk and sk
// 
// ************
// ************
//
// Deletes item in database using the event body params
//
// ************
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     if (event.requestContext.authorizer) {
//         console.log(event)
//         console.log("claims", event.requestContext.authorizer.claims)
//     }

//     const docClient = new AWS.DynamoDB.DocumentClient()
//     let responseBody = ""
//     let statusCode = 0

//     const data = JSON.parse(event.body)

//     // params
//     // requires full primary key - partition key and 
//     // sort key if sort key is defined
//     const params = {
//         TableName: 'Users-dev',
//         Key: {
//             cognitoid: data.cognitoid,
//             username: data.username
//         }
//     }
    
//     try {
//         const data = await docClient.delete(params).promise();
//         responseBody = JSON.stringify(data)
//         statusCode = 200
//     } catch (err) {
//         responseBody = `Unable to get Products: ${err}`
//         statusCode = 403
//     }
    
//     console.log("responseBody", responseBody)

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

// Get Function with partition key and sort key - highly efficient
// prefer Get to Query when possible
// ************
// ************
//
// Gets Item from database using the following and returns result
// partition key: cognitoid
// sort key: username
//
// ************
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     if (event.requestContext.authorizer) {
//         console.log(event)
//         console.log("claims", event.requestContext.authorizer.claims)
//     }

//     const docClient = new AWS.DynamoDB.DocumentClient()
//     let responseBody = ""
//     let statusCode = 0

//     const cognitoid = event.queryStringParameters.cognitoid
//     const username = event.queryStringParameters.username

//     console.log("cognito-id", cognitoid)

//     console.log("queryparams", event.queryStringParameters)
//     console.log("body", event.body)

//     // notice the way the params are structured here,
//     // both the partition and sort key are placed within
//     // the Key object
//     // 
//     // Becaise "name" is a reserved word in dynamodb, we use #n and 
//     // define the actual attribute in the ExpressionAttributeNames
//     // object. We do this for username as well
//     const params = {
//         TableName: 'Users-dev',
//         Key: {
//             "cognitoid": `${cognitoid}`,
//             "username": `${username}`
//         },
//         ProjectionExpression: "cognitoid, #u, #n", // the other attributes are just stuff admins need
//         ExpressionAttributeNames: {
//             "#u": "username",
//             "#n": "name"
//         }
//     }
    
//     try {
//         const data = await docClient.get(params).promise();
//         responseBody = JSON.stringify(data.Item)
//         statusCode = 200
//     } catch (err) {
//         responseBody = `Unable to get Products: ${err}`
//         statusCode = 403
//     }
    
//     console.log("responseBody", responseBody)

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

// Query Function with partition key only - efficient
// ************
// ************
//
// Queries database using the following and returns result
// partition key: cognitoid
// sort key: NONE
//
// ************
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     if (event.requestContext.authorizer) {
//         console.log(event)
//         console.log("claims", event.requestContext.authorizer.claims)
//     }

//     const docClient = new AWS.DynamoDB.DocumentClient()
//     let responseBody = ""
//     let statusCode = 0

//     const cognitoid = event.queryStringParameters.cognitoid
//     const username = event.queryStringParameters.username

//     console.log("cognito-id", cognitoid)

//     console.log("queryparams", event.queryStringParameters)
//     console.log("body", event.body)

//     const params = {
//         TableName: 'Users-dev',
//         KeyConditionExpression: 'cognitoid = :value',
//         ExpressionAttributeValues: { 
//             ':value': `${cognitoid}`
//         }
//     }
//     try {
//         const data = await docClient.query(params).promise();
//         responseBody = JSON.stringify(data.Items)
//         statusCode = 200
//     } catch (err) {
//         responseBody = `Unable to get Products: ${err}`
//         statusCode = 403
//     }
    
//     console.log("responseBody", responseBody)

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


// Query Function with partition + sort key
// ************
// ************
//
// Queries database using the following and returns result
// partition key: cognitoid
// sort key: username
//
// ************
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     if (event.requestContext.authorizer) {
//         console.log(event)
//         console.log("claims", event.requestContext.authorizer.claims)
//     }

//     const docClient = new AWS.DynamoDB.DocumentClient()
//     let responseBody = ""
//     let statusCode = 0

//     const cognitoid = event.queryStringParameters.cognitoid
//     const username = event.queryStringParameters.username

//     console.log("cognito-id", cognitoid)
//     console.log("username", username)

//     console.log("queryparams", event.queryStringParameters)
//     console.log("body", event.body)

//     const params = {
//         TableName: 'Users-dev',
//         KeyConditionExpression: 'cognitoid = :value AND username = :value2',
//         ExpressionAttributeValues: { 
//             ':value': `${cognitoid}`,
//             ':value2': `${username}`
//         }
//     }
//     try {
//         const data = await docClient.query(params).promise();
//         responseBody = JSON.stringify(data.Items)
//         statusCode = 200
//     } catch (err) {
//         responseBody = `Unable to get Products: ${err}`
//         statusCode = 403
//     }
    
//     console.log("responseBody", responseBody)

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
//     const docClient = new AWS.DynamoDB.DocumentClient()
//     let responseBody = ""
//     let statusCode = 0

//     // only need database name for scan
//     const params = {
//         TableName: 'Users-dev',
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
// ************
// ************
//
// Initial test that returns "Hello from lambda"
//
// ************
// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     if (event.requestContext.authorizer) {
//         console.log("claims", event.requestContext.authorizer.claims)
//     }
    
//     const response = {
//         statusCode: 200,
//     //  Uncomment below to enable CORS requests
//         headers: {
//             "Access-Control-Allow-Origin": "*",
//             "Access-Control-Allow-Headers": "*"
//      }, 
//         body: JSON.stringify('Hello from Lambda!'),
//     };
//     return response;
// };

