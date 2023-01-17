const AWS = require('aws-sdk')

// Pre Signup
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event, context) => {
  console.log("EVENT:", event)

  let responseObject = {
    responseBody: null,
    statusCode: 0
  }

  if (event.request.userAttributes) {
    // console.log("sub exists, calling AddtToUserTable function")
    responseObject = await CheckUniquesTable(event.request.userAttributes)
  } else {
    console.log(`Error: Nothing was written to DynamoDB for event: ${event}`)
    responseObject.responseBody = "UnknownError"
    responseObject.statusCode = 400
  }

  console.log("response Object outside of BatchGet:", responseObject)

  if (responseObject.statusCode !== 200) {
    let err;
    if (responseObject.responseBody === "EmailExistsError") {
      err = new Error("EmailExistsError")
    } else if (responseObject.responseBody === "UserNameExistsError") {
      err = new Error("UserNameExistsError")
    } 
    else {
      err = new Error("UnknownError")
    }
    throw err;
  } else {
    return event;
  }
};

// Uses BatchWriteItem to add user data to 
// the User and Uniques Tables
const CheckUniquesTable = async (user_attributes) => {

  console.log("in CheckUniquesTable")
  const docClient = new AWS.DynamoDB.DocumentClient()
  let response;

  responseObject = {
    responseBody: null,
    statusCode: 0
  }

  // 
  let params = {
    RequestItems: {
      "Uniques": {
        "Keys": [
          {
            "uniques_pk": `${user_attributes.preferred_username}`,
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

  console.log("params for docClient: ", params)

  try {
    response = await docClient.batchGet(params).promise()
    responseObject.statusCode = 200
    console.log("checked uniques. Data found:", response)
  } catch (err) {
    console.log("Error", err)
    responseObject.responseBody = err
    responseObject.responseBody = 403
  }

  // if the response is not an empty array, we have a match
  if (response.Responses.Uniques.length) {
    console.log("uniques response", response.Responses.Uniques)
    // grab first non-unique value and use it as the error
    if (response.Responses.Uniques[0].type_sk === "username") {
      responseObject.responseBody = "UserNameExistsError"
      responseObject.statusCode = 403
    } else if (response.Responses.Uniques[0].type_sk === "email") {
      responseObject.responseBody = "EmailExistsError"
      responseObject.statusCode = 403
    } else {
      responseObject.responseBody = "UnknownError"
      responseObject.statusCode = 403
    }
  }

  return responseObject
}