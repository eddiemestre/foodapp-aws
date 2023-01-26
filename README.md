# The Food App

A mobile web-app that lets users create, read, update, and delete restaurant reviews.

View a working demo [here](https://main.d30b8nboe5jb5.amplifyapp.com/). Best viewed on a mobile device or in a desktop browser with a mobile viewport. 

Demo Credentials:  
email: demo@demofoodapp.com  
password: demo!234    
(account creation/login also also supported!)

This app uses [AWS Amplify](https://aws.amazon.com/amplify/) to  host a React frontend that communicates with DynamoDB using exposed API endpoints via API Gateway. All endpoints trigger NodeJS Lambda functions that talk directly to the database. Cognito is also used for authentication and authorization.

The app utilizes the [react-spring](https://react-spring.dev/) library for site-wide animations. 

