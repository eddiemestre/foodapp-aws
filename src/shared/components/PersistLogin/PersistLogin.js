import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from "../../../hooks/useAuth";
import { Auth } from "aws-amplify";
import { FadeLoader } from "react-spinners";

const PersistLogin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { auth, setAuth } = useAuth();
    const delay = ms => new Promise(res => setTimeout(res, ms));

    useEffect(() => {
        const GetUser = async () => {
            try {
                await Auth.currentSession()
                const user = await Auth.currentAuthenticatedUser();
                // console.log("in persist login user:", user)

                setAuth(prevState => {
                    return {
                        ...prevState,
                        name: user?.attributes?.name,
                        email: user?.attributes?.email,
                        username: user?.attributes.preferred_username
                    }
                })
            }
            catch (err) {
                console.error(err);
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
        !auth ? FetchUser() : setIsLoading(false);
 
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