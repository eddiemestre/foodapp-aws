import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from "../../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Auth, API } from "aws-amplify";
import { FadeLoader } from "react-spinners";
import useLogout from "../../../hooks/useLogout";

const PersistLogin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { auth, setAuth } = useAuth();
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const logout = useLogout();
    const navigate = useNavigate();

    useEffect(() => {
        const GetUser = async () => {
            try {
                // get current user credentials
                await Auth.currentSession()
                const user = await Auth.currentAuthenticatedUser();

                // console.log("persist user", user)
                // use those user credentials to form a get request
                const requestInfo = {
                    response: true,
                    queryStringParameters: {
                        uniques_pk: `${user?.attributes?.email}`,
                        type_sk: 'email'
                    },
                }
        
                // get user data
                const data = await API.get('lambdaapitest', '/users', requestInfo)

                // console.log("in persist login user:", data)

                // use user data to set auth state variables
                setAuth(prevState => {
                    return {
                        ...prevState,
                        name: data?.data?.name,
                        email: user?.attributes?.email,
                        username: data?.data?.username
                    }
                })
            }
            catch (err) {
                // if there is an error, logout and navigate
                // to the login screen
                console.error("an error occured", err);
                await logout();
                navigate(`/login`)
            }
            finally {
                await delay(1000)
                setIsLoading(false);
            }
        }

        const FetchUser = async () => {
            // console.log('fetch user')
            await GetUser()
        }

        // if not auth, fetch User
        // eventually make this higher level so that we just get whether 
        // a user is signed in or not - this can be a new component or 
        // built into this one - the idea being that we have the "is Loading" 
        // moment customized to specific pages and we can call the is Loading 
        // design elements we need depending on the params
        !auth?.name ? FetchUser() : setIsLoading(false);
 
    }, [])

    // useEffect(() => {
    //     console.log(`isLoading: ${isLoading}`)
    //     console.log(`auth: ${auth?.name}`)
    // }, [isLoading])

    // TODO:
    // implement a page-by-page based set of css loaders
    // that correspond with the general designs of each page
    return (
        <>
        {isLoading
            ? <FadeLoader
                color="white"
                loading={isLoading}
                size={150}
                aria-label="Loading Spinner"
                data-testid="loader" />
            : <Outlet /> 
        }
        {/* {isLoading
            ? <p style={{backgroundColor: "white"}}>Loading...</p>
            : <Outlet /> 
        } */}
        </>

    )
}

export default PersistLogin;