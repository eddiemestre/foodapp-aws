const AWS = require('aws-sdk')

// Post Confirmation
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event, context) => {
  console.log("EVENT:", event)
  let responseObject; 

  if (event.request.userAttributes.sub) {
    // console.log("sub exists, calling AddtToUserTable function")
    responseObject = await AddUserDataToTables(event.request.userAttributes)
  } else {
    console.log(`Error: Nothing was written to DynamoDB for event: ${event}`)
    responseObject.statusCode = 400
  }

  const response = {
    "statusCode": responseObject?.statusCode || 404,
  //  Uncomment below to enable CORS requests
    // "headers": {
    //     "Access-Control-Allow-Origin": "*",
    //     "Access-Control-Allow-Headers": "*",
    //     "Content-Type": "application/json"
    // }, 
    // "body": responseBody
    "body": responseObject?.responseBody || null
  }

  if (responseObject.statusCode !== 200) {
    throw new Error("UnknownError")
  }
  return response;
};

// Uses BatchWriteItem to add user data to 
// the User and Uniques Tables
const AddUserDataToTables = async (user_attributes) => {

  console.log("in Add To User Table")
  const docClient = new AWS.DynamoDB.DocumentClient()
  let response;

  responseObject = {
    responseBody: '',
    statusCode: 0
  }

  // 
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
            // the attributes we're adding to the Table
            Item: {
              id: `${user_attributes.sub}`,
              name: `${user_attributes.name}`,
              username: `${user_attributes.preferred_username}`,
              verified: (user_attributes.email_verified === 'true')
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
            // attributes we're adding to the Table
            Item: {
              uniques_pk: `${user_attributes.preferred_username}`,
              type_sk: "username",
              id: `${user_attributes.sub}`
            }
          }
        },
        {
          PutRequest: {
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

  console.log("params for docClient: ", params)

  try {
    response = await docClient.batchWrite(params).promise()
    responseObject.responseBody = JSON.stringify(response)
    responseObject.statusCode = 200
    console.log("success adding user to both databases")
  } catch (err) {
    console.log("Error", err)
    responseObject.responseBody = 403
    return responseObject
  }

  return responseObject
}